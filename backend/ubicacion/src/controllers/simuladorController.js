const HistorialUbicacion = require('../models/HistorialUbicacion');

const activeSimulations = new Map();

const RUTAS_URL = process.env.RUTAS_SERVICE_URL || 'http://localhost:3002';
const NOTIFICACIONES_URL = process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:3006';

// Math Helpers
function toRad(value) { return value * Math.PI / 180; }
function toDeg(value) { return value * 180 / Math.PI; }

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
}

function calcBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const bearing = Math.atan2(y, x);
  return (toDeg(bearing) + 360) % 360;
}

function moveTowards(lat1, lon1, lat2, lon2, distanceToMove) {
  const dist = calcDist(lat1, lon1, lat2, lon2);
  if (dist <= distanceToMove) return { lat: lat2, lng: lon2, reached: true };
  const ratio = distanceToMove / dist;
  const lat = lat1 + (lat2 - lat1) * ratio;
  const lng = lon1 + (lon2 - lon1) * ratio;
  return { lat, lng, reached: false };
}

function isValidPoint(point) {
  return point &&
    Number.isFinite(Number(point.lat)) &&
    Number.isFinite(Number(point.lng));
}

function normalizePoint(point) {
  return {
    lat: Number(point.lat),
    lng: Number(point.lng)
  };
}

function isSamePoint(a, b) {
  return calcDist(a.lat, a.lng, b.lat, b.lng) < 0.001;
}

function appendUniquePoint(points, point) {
  if (!isValidPoint(point)) return;

  const normalized = normalizePoint(point);
  const previous = points[points.length - 1];
  if (!previous || !isSamePoint(previous, normalized)) {
    points.push(normalized);
  }
}

function obtenerPuntosControlRuta(ruta) {
  const puntos = [];

  appendUniquePoint(puntos, ruta.origen);
  for (const waypoint of ruta.waypoints || []) {
    appendUniquePoint(puntos, waypoint);
  }
  appendUniquePoint(puntos, ruta.destino);

  return puntos;
}

function buscarSegmentoMasCercano(path, point) {
  if (!isValidPoint(point) || path.length < 2) return 1;

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length; i++) {
    const distance = calcDist(point.lat, point.lng, path[i].lat, path[i].lng);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  return Math.min(closestIndex + 1, path.length - 1);
}

function avanzarSobreGeometria(sim, distanceKm) {
  let remainingKm = distanceKm;
  let currentLat = sim.lat;
  let currentLng = sim.lng;
  let segmentIndex = sim.segmentIndex;
  let bearing = sim.bearing || 0;
  let completedRoute = false;
  let safety = sim.routePoints.length * 2 + 10;

  while (remainingKm > 0 && safety > 0) {
    safety--;

    if (segmentIndex >= sim.routePoints.length) {
      completedRoute = true;
      currentLat = sim.routePoints[0].lat;
      currentLng = sim.routePoints[0].lng;
      segmentIndex = 1;
    }

    const target = sim.routePoints[segmentIndex];
    const segmentKm = calcDist(currentLat, currentLng, target.lat, target.lng);

    if (segmentKm === 0) {
      segmentIndex++;
      continue;
    }

    bearing = calcBearing(currentLat, currentLng, target.lat, target.lng);

    if (segmentKm <= remainingKm) {
      currentLat = target.lat;
      currentLng = target.lng;
      remainingKm -= segmentKm;
      segmentIndex++;
    } else {
      const move = moveTowards(currentLat, currentLng, target.lat, target.lng, remainingKm);
      currentLat = move.lat;
      currentLng = move.lng;
      remainingKm = 0;
    }
  }

  return {
    lat: currentLat,
    lng: currentLng,
    segmentIndex,
    bearing,
    completedRoute
  };
}

async function notificarLlegada(vehiculoId) {
  try {
    await fetch(`${NOTIFICACIONES_URL}/notificaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehiculoId,
        tipo: 'llegada',
        mensaje: `El vehículo ha llegado a su destino`
      })
    });
  } catch (err) {
    console.error(`[simulador] Error notificando llegada de ${vehiculoId}:`, err.message);
  }
}

async function obtenerRutaOSRM(waypoints) {
  try {
    const coordsStr = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error(`OSRM API respondió con estado ${res.status}`);
    
    const data = await res.json();
    if (data.routes && data.routes.length > 0 && data.routes[0].geometry) {
      const coordinates = data.routes[0].geometry.coordinates;
      const path = coordinates
        .map(coord => ({ lat: Number(coord[1]), lng: Number(coord[0]) }))
        .filter(isValidPoint);

      if (path.length < 2) {
        throw new Error('OSRM devolvió menos de 2 puntos de geometría');
      }

      console.log(`[simulador] Usando ruta OSRM con ${path.length} puntos`);
      return { routePoints: path, source: 'osrm' };
    }
    throw new Error('Estructura de respuesta OSRM inválida');
  } catch (error) {
    console.error(`[simulador] Error obteniendo ruta OSRM:`, error.message);
    console.log(`[simulador] Fallback a waypoints lineales`);
    return { routePoints: waypoints, source: 'lineal' };
  }
}

// POST /simulador/start/:vehiculoId
exports.start = async (req, res) => {
  const { vehiculoId } = req.params;

  if (activeSimulations.has(vehiculoId)) {
    return res.status(400).json({ message: 'El simulador ya está activo para este vehículo' });
  }

  try {
    // 1. Obtener la ruta asignada consultando al microservicio de Rutas
    const rutasRes = await fetch(`${RUTAS_URL}/`);
    if (!rutasRes.ok) throw new Error('No se pudo conectar al servicio de Rutas');

    const rutas = await rutasRes.json();
    const rutaAsignada = rutas.find(r => String(r.vehiculoAsignado) === String(vehiculoId));

    if (!rutaAsignada) {
      return res.status(400).json({ message: 'El vehículo no tiene una ruta asignada' });
    }

    const puntosControl = obtenerPuntosControlRuta(rutaAsignada);
    if (puntosControl.length < 2) {
      return res.status(400).json({ message: 'El vehículo no tiene una ruta asignada válida con origen/destino o waypoints' });
    }

    const { routePoints, source } = await obtenerRutaOSRM(puntosControl);
    
    let currentLat = routePoints[0].lat;
    let currentLng = routePoints[0].lng;
    let segmentIndex = 1;

    // Si ya existe historial, continuar desde la última ubicación conocida
    const ultimaUbicacion = await HistorialUbicacion.findOne({ vehiculoId }).sort({ timestamp: -1 });
    if (ultimaUbicacion) {
      currentLat = ultimaUbicacion.lat;
      currentLng = ultimaUbicacion.lng;
      segmentIndex = buscarSegmentoMasCercano(routePoints, ultimaUbicacion);
    }

    const velocidadKmh = 60; // Simularemos una velocidad constante de 60 km/h
    const intervalSecs = 3;
    const distancePerTick = (velocidadKmh / 3600) * intervalSecs; // Distancia en km recorrida en 3 seg (aprox 0.05 km)

    // Iniciar job cada 3 segundos
    const intervalId = setInterval(async () => {
      const simData = activeSimulations.get(vehiculoId);
      if (!simData) return;

      const next = avanzarSobreGeometria(simData, distancePerTick);
      currentLat = next.lat;
      currentLng = next.lng;
      segmentIndex = next.segmentIndex;
      simData.lat = currentLat;
      simData.lng = currentLng;
      simData.segmentIndex = segmentIndex;
      simData.bearing = next.bearing;

      const nuevaUbicacion = new HistorialUbicacion({
        vehiculoId,
        lat: currentLat,
        lng: currentLng,
        velocidadKmh,
        bearing: next.bearing
      });

      try {
        await nuevaUbicacion.save();
        console.log(`[simulador] Vehículo ${vehiculoId} en ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)} -> segmento ${segmentIndex}/${routePoints.length - 1} (${source})`);

        if (next.completedRoute) {
          console.log(`[simulador] Vehículo ${vehiculoId} completó el recorrido. Reiniciando circuito continuo...`);
          await notificarLlegada(vehiculoId);
        }
      } catch (err) {
        console.error(`[simulador] Error guardando ubicación de ${vehiculoId}:`, err.message);
      }
    }, intervalSecs * 1000);

    // Guardar en el mapa de simulaciones
    activeSimulations.set(vehiculoId, {
      intervalId,
      lat: currentLat,
      lng: currentLng,
      segmentIndex,
      bearing: 0,
      routePoints,
      source
    });

    try {
      await fetch(`${process.env.VEHICULOS_SERVICE_URL || 'http://vehiculos:3001'}/vehiculos/${vehiculoId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoActual: 'en_ruta' })
      });
    } catch (err) {
      console.error(`[simulador] Error cambiando estado a en_ruta:`, err.message);
    }

    res.json({
      message: 'Simulador real iniciado con ruta',
      vehiculoId,
      fuenteRuta: source,
      puntosControl: puntosControl.length,
      puntosA_Recorrer: routePoints.length
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar simulación', error: error.message });
  }
};

// POST /simulador/stop/:vehiculoId
exports.stop = (req, res) => {
  const { vehiculoId } = req.params;

  if (!activeSimulations.has(vehiculoId)) {
    return res.status(404).json({ message: 'No hay simulación activa para este vehículo' });
  }

  const simData = activeSimulations.get(vehiculoId);
  clearInterval(simData.intervalId);
  activeSimulations.delete(vehiculoId);

  try {
    fetch(`${process.env.VEHICULOS_SERVICE_URL || 'http://vehiculos:3001'}/vehiculos/${vehiculoId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estadoActual: 'detenido' })
    }).catch(err => console.error(`[simulador] Error cambiando estado a detenido en stop:`, err.message));
  } catch (err) {
    // Ignorar si el fetch síncrono falla por algo raro
  }

  res.json({ message: 'Simulador detenido manualmente', vehiculoId });
};

// GET /simulador/status
exports.getStatus = (req, res) => {
  const activeIds = Array.from(activeSimulations.keys());
  res.json({
    activeCount: activeIds.length,
    activeSimulations: activeIds
  });
};

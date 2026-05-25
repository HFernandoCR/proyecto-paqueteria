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

// POST /simulador/start/:vehiculoId
exports.start = async (req, res) => {
  const { vehiculoId } = req.params;

  if (activeSimulations.has(vehiculoId)) {
    return res.status(400).json({ message: 'El simulador ya está activo para este vehículo' });
  }

  try {
    // 1. Obtener la ruta asignada consultando al microservicio de Rutas
    const rutasRes = await fetch(`${RUTAS_URL}/rutas`);
    if (!rutasRes.ok) throw new Error('No se pudo conectar al servicio de Rutas');
    
    const rutas = await rutasRes.json();
    const rutaAsignada = rutas.find(r => String(r.vehiculoAsignado) === String(vehiculoId));

    if (!rutaAsignada || !rutaAsignada.waypoints || rutaAsignada.waypoints.length < 2) {
      return res.status(400).json({ message: 'El vehículo no tiene una ruta asignada válida con waypoints' });
    }

    const waypoints = rutaAsignada.waypoints;
    let currentLat = waypoints[0].lat;
    let currentLng = waypoints[0].lng;
    let nextWaypointIndex = 1;

    // Si ya existe historial, continuar desde la última ubicación conocida
    const ultimaUbicacion = await HistorialUbicacion.findOne({ vehiculoId }).sort({ timestamp: -1 });
    if (ultimaUbicacion) {
      currentLat = ultimaUbicacion.lat;
      currentLng = ultimaUbicacion.lng;
    }

    const velocidadKmh = 60; // Simularemos una velocidad constante de 60 km/h
    const intervalSecs = 3;
    const distancePerTick = (velocidadKmh / 3600) * intervalSecs; // Distancia en km recorrida en 3 seg (aprox 0.05 km)

    // Iniciar job cada 3 segundos
    const intervalId = setInterval(async () => {
      const target = waypoints[nextWaypointIndex];
      
      const bearing = calcBearing(currentLat, currentLng, target.lat, target.lng);
      const move = moveTowards(currentLat, currentLng, target.lat, target.lng, distancePerTick);
      
      currentLat = move.lat;
      currentLng = move.lng;

      const nuevaUbicacion = new HistorialUbicacion({
        vehiculoId,
        lat: currentLat,
        lng: currentLng,
        velocidadKmh,
        bearing
      });

      try {
        await nuevaUbicacion.save();
        console.log(`[simulador] Vehículo ${vehiculoId} en ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)} -> Hacia waypoint ${nextWaypointIndex}`);
        
        if (move.reached) {
          nextWaypointIndex++;
          if (nextWaypointIndex >= waypoints.length) {
            console.log(`[simulador] Vehículo ${vehiculoId} ha llegado a su destino.`);
            clearInterval(intervalId);
            activeSimulations.delete(vehiculoId);
            await notificarLlegada(vehiculoId);
            try {
              await fetch(`${process.env.VEHICULOS_SERVICE_URL || 'http://vehiculos:3001'}/vehiculos/${vehiculoId}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estadoActual: 'detenido' })
              });
            } catch (err) {
              console.error(`[simulador] Error cambiando estado a detenido:`, err.message);
            }
          }
        }
      } catch (err) {
        console.error(`[simulador] Error guardando ubicación de ${vehiculoId}:`, err.message);
      }
    }, intervalSecs * 1000);

    // Guardar en el mapa de simulaciones
    activeSimulations.set(vehiculoId, { intervalId, lat: currentLat, lng: currentLng });

    try {
      await fetch(`${process.env.VEHICULOS_SERVICE_URL || 'http://vehiculos:3001'}/vehiculos/${vehiculoId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoActual: 'en_ruta' })
      });
    } catch (err) {
      console.error(`[simulador] Error cambiando estado a en_ruta:`, err.message);
    }

    res.json({ message: 'Simulador real iniciado con ruta', vehiculoId, puntosA_Recorrer: waypoints.length });

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

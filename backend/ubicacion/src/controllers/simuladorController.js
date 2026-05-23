const HistorialUbicacion = require('../models/HistorialUbicacion');

// Mapa en memoria para almacenar los intervalos de simulación activos
// llave: vehiculoId, valor: { intervalId, lat, lng }
const activeSimulations = new Map();

// POST /simulador/start/:vehiculoId
exports.start = async (req, res) => {
  const { vehiculoId } = req.params;

  if (activeSimulations.has(vehiculoId)) {
    return res.status(400).json({ message: 'El simulador ya está activo para este vehículo' });
  }

  // Coordenadas iniciales base (ej. centro de CDMX o cualquier punto)
  let currentLat = 19.432608;
  let currentLng = -99.133209;

  // Intentar obtener la última ubicación conocida para continuar desde ahí
  const ultimaUbicacion = await HistorialUbicacion.findOne({ vehiculoId }).sort({ timestamp: -1 });
  if (ultimaUbicacion) {
    currentLat = ultimaUbicacion.lat;
    currentLng = ultimaUbicacion.lng;
  }

  // Iniciar job cada 3 segundos
  const intervalId = setInterval(async () => {
    // Modo Placebo: Simular movimiento aleatorio muy pequeño
    // (Aprox. +/- 0.0005 grados en lat/lng)
    currentLat += (Math.random() - 0.5) * 0.001;
    currentLng += (Math.random() - 0.5) * 0.001;

    const nuevaUbicacion = new HistorialUbicacion({
      vehiculoId,
      lat: currentLat,
      lng: currentLng,
      velocidadKmh: Math.floor(Math.random() * 20) + 40, // velocidad aleatoria entre 40 y 60
      bearing: Math.floor(Math.random() * 360) // dirección aleatoria
    });

    try {
      await nuevaUbicacion.save();
      console.log(`[simulador] Vehículo ${vehiculoId} movido a ${currentLat}, ${currentLng}`);
    } catch (err) {
      console.error(`[simulador] Error guardando ubicación de ${vehiculoId}:`, err.message);
    }
  }, 3000);

  // Guardar en el mapa de simulaciones
  activeSimulations.set(vehiculoId, { intervalId, lat: currentLat, lng: currentLng });

  res.json({ message: 'Simulador iniciado en modo placebo', vehiculoId });
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

  res.json({ message: 'Simulador detenido', vehiculoId });
};

// GET /simulador/status
exports.getStatus = (req, res) => {
  const activeIds = Array.from(activeSimulations.keys());
  res.json({ 
    activeCount: activeIds.length,
    activeSimulations: activeIds 
  });
};

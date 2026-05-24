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

  // Coordenadas iniciales dentro del rango Oaxaca (16.8–17.2, −97.0 a −96.5)
  const LAT_MIN = 16.8, LAT_MAX = 17.2;
  const LNG_MIN = -97.0, LNG_MAX = -96.5;
  let currentLat = 17.0732;
  let currentLng = -96.7266;

  // Intentar obtener la última ubicación conocida para continuar desde ahí
  // Solo se reutiliza si sigue dentro del rango Oaxaca
  const ultimaUbicacion = await HistorialUbicacion.findOne({ vehiculoId }).sort({ timestamp: -1 });
  if (
    ultimaUbicacion &&
    ultimaUbicacion.lat >= LAT_MIN && ultimaUbicacion.lat <= LAT_MAX &&
    ultimaUbicacion.lng >= LNG_MIN && ultimaUbicacion.lng <= LNG_MAX
  ) {
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
  const activos = Array.from(activeSimulations.keys()).map((vehiculoId) => ({
    vehiculoId,
    intervaloMs: 3000
  }));
  res.json({ activos, total: activos.length });
};

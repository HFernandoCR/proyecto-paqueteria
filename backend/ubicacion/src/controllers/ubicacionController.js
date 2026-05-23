const HistorialUbicacion = require('../models/HistorialUbicacion');

// GET /ubicaciones/actual/:vehiculoId
exports.getActual = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    // Buscar la ubicación más reciente para el vehículo
    const ubicacion = await HistorialUbicacion.findOne({ vehiculoId })
      .sort({ timestamp: -1 });

    if (!ubicacion) {
      return res.status(404).json({ message: 'Ubicación no encontrada para el vehículo' });
    }

    res.json(ubicacion);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ubicación actual', error: error.message });
  }
};

// GET /ubicaciones/historial/:vehiculoId
exports.getHistorial = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    // Buscar todas las ubicaciones, ordenadas de más nueva a más vieja
    const historial = await HistorialUbicacion.find({ vehiculoId })
      .sort({ timestamp: -1 });

    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de ubicación', error: error.message });
  }
};

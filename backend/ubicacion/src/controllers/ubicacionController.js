const HistorialUbicacion = require('../models/HistorialUbicacion');
const mongoose = require('mongoose');

const MAX_LIMIT = 1000;

function parsePositiveInt(value, fallback = 0) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_LIMIT);
}

function buildDateFilter(query) {
  const timestamp = {};
  if (query.desde) timestamp.$gte = new Date(query.desde);
  if (query.hasta) timestamp.$lte = new Date(query.hasta);
  return Object.keys(timestamp).length > 0 ? { timestamp } : {};
}

function buildProjection(fields) {
  if (!fields) return null;
  const allowed = new Set(['vehiculoId', 'lat', 'lng', 'velocidadKmh', 'bearing', 'timestamp']);
  return fields
    .split(',')
    .map((field) => field.trim())
    .filter((field) => allowed.has(field))
    .reduce((projection, field) => ({ ...projection, [field]: 1 }), { vehiculoId: 1 });
}

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

// GET /ubicaciones/historial/:vehiculoId[?limit=N]
exports.getHistorial = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    const limit = parsePositiveInt(req.query.limit);
    const projection = buildProjection(req.query.fields);

    let query = HistorialUbicacion.find(
      { vehiculoId, ...buildDateFilter(req.query) },
      projection
    ).sort({ timestamp: -1 });
    if (limit > 0) query = query.limit(limit);

    const historial = await query.lean();
    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de ubicación', error: error.message });
  }
};

// GET /ubicaciones/historial?vehiculoIds=id1,id2[&limit=N&desde=ISO&hasta=ISO&fields=lat,lng,timestamp]
exports.getHistorialBulk = async (req, res) => {
  try {
    const vehiculoIds = String(req.query.vehiculoIds || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (vehiculoIds.length === 0) {
      return res.status(400).json({ message: 'vehiculoIds es requerido' });
    }

    const invalidId = vehiculoIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidId) {
      return res.status(400).json({ message: `vehiculoId inválido: ${invalidId}` });
    }

    const ids = vehiculoIds.map((id) => new mongoose.Types.ObjectId(id));
    const limit = parsePositiveInt(req.query.limit);
    const projection = buildProjection(req.query.fields);
    const match = { vehiculoId: { $in: ids }, ...buildDateFilter(req.query) };
    const historialPorVehiculo = Object.fromEntries(vehiculoIds.map((id) => [id, []]));

    let historial;
    if (limit > 0) {
      const projectStage = projection
        ? { $project: projection }
        : { $project: { _orden: 0 } };

      historial = await HistorialUbicacion.aggregate([
        { $match: match },
        {
          $setWindowFields: {
            partitionBy: '$vehiculoId',
            sortBy: { timestamp: -1 },
            output: { _orden: { $documentNumber: {} } },
          },
        },
        { $match: { _orden: { $lte: limit } } },
        { $sort: { vehiculoId: 1, timestamp: -1 } },
        projectStage,
      ]);
    } else {
      historial = await HistorialUbicacion.find(match, projection)
        .sort({ vehiculoId: 1, timestamp: -1 })
        .lean();
    }

    for (const punto of historial) {
      const id = String(punto.vehiculoId);
      if (!historialPorVehiculo[id]) historialPorVehiculo[id] = [];
      historialPorVehiculo[id].push(punto);
    }

    res.json(historialPorVehiculo);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de ubicación', error: error.message });
  }
};

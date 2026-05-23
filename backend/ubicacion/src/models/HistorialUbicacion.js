const mongoose = require('mongoose');

const historialUbicacionSchema = new mongoose.Schema({
  vehiculoId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  velocidadKmh: {
    type: Number,
    default: 0
  },
  bearing: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Índice compuesto sugerido en el PLAN.md
historialUbicacionSchema.index({ vehiculoId: 1, timestamp: -1 });

module.exports = mongoose.model('HistorialUbicacion', historialUbicacionSchema);

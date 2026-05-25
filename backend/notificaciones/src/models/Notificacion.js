const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  vehiculoId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'El vehiculoId es obligatorio'],
  },
  tipo: {
    type: String,
    enum: ['llegada', 'cambio_estado', 'anomalia'],
    required: [true, 'El tipo es obligatorio'],
  },
  mensaje: {
    type: String,
    required: [true, 'El mensaje es obligatorio'],
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  leida: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Notificacion', notificacionSchema);

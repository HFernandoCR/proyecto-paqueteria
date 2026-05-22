const mongoose = require('mongoose');

const vehiculoSchema = new mongoose.Schema(
  {
    placa: {
      type: String,
      required: [true, 'La placa es obligatoria'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    modelo: {
      type: String,
      required: [true, 'El modelo es obligatorio'],
      trim: true,
    },
    capacidadKg: {
      type: Number,
      required: [true, 'La capacidad en kg es obligatoria'],
      min: [0, 'La capacidad no puede ser negativa'],
    },
    estadoActual: {
      type: String,
      enum: ['disponible', 'en_ruta', 'detenido', 'entregando', 'mantenimiento'],
      default: 'disponible',
    },
    operadorId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    rutaAsignadaId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehiculo', vehiculoSchema);

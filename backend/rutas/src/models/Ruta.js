const mongoose = require('mongoose');

const puntoSchema = new mongoose.Schema(
  { lat: Number, lng: Number, direccion: String },
  { _id: false }
);

const waypointSchema = new mongoose.Schema(
  { lat: Number, lng: Number },
  { _id: false }
);

const rutaSchema = new mongoose.Schema(
  {
    nombre:              { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    origen:              puntoSchema,
    destino:             puntoSchema,
    waypoints:           [waypointSchema],
    distanciaKm:         Number,
    duracionEstimadaMin: Number,
    vehiculoAsignado:    { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ruta', rutaSchema);

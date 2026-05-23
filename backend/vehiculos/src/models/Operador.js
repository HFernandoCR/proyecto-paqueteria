const mongoose = require('mongoose');

const operadorSchema = new mongoose.Schema(
  {
    nombre:   { type: String, required: [true, 'El nombre es obligatorio'],   trim: true },
    licencia: { type: String, required: [true, 'La licencia es obligatoria'], trim: true },
    telefono: { type: String, trim: true },
    activo:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Operador', operadorSchema);

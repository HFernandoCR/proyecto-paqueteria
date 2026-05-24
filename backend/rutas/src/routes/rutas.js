const express = require('express');
const Ruta = require('../models/Ruta');

const router = express.Router();

function handleError(res, err) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID inválido' });
  }
  return res.status(500).json({ error: 'Error interno del servidor' });
}

// POST / — crear ruta
router.post('/', async (req, res) => {
  try {
    const ruta = await new Ruta(req.body).save();
    res.status(201).json(ruta);
  } catch (err) {
    handleError(res, err);
  }
});

// GET / — listar rutas
router.get('/', async (req, res) => {
  try {
    const rutas = await Ruta.find();
    res.json(rutas);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;

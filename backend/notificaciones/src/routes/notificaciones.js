const express = require('express');
const Notificacion = require('../models/Notificacion');

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

// POST / — crear notificación
router.post('/', async (req, res) => {
  try {
    const notificacion = await new Notificacion(req.body).save();
    res.status(201).json(notificacion);
  } catch (err) {
    handleError(res, err);
  }
});

// GET / — listar notificaciones (filtro opcional ?leida=false|true)
router.get('/', async (req, res) => {
  try {
    const { leida } = req.query;
    const filtro = {};

    if (leida !== undefined) {
      if (leida !== 'true' && leida !== 'false') {
        return res.status(400).json({ error: 'Parámetro leida inválido. Use true o false.' });
      }
      filtro.leida = leida === 'true';
    }

    const notificaciones = await Notificacion.find(filtro).sort({ timestamp: -1 });
    res.json(notificaciones);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;

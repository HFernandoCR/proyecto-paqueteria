const express = require('express');
const Operador = require('../models/Operador');

const router = express.Router();

function handleError(res, err) {
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  if (err.name === 'CastError')       return res.status(400).json({ error: 'ID inválido' });
  return res.status(500).json({ error: 'Error interno del servidor' });
}

// POST / — crear operador
router.post('/', async (req, res) => {
  try {
    const operador = await new Operador(req.body).save();
    res.status(201).json(operador);
  } catch (err) { handleError(res, err); }
});

// GET / — listar operadores
router.get('/', async (req, res) => {
  try {
    const operadores = await Operador.find();
    res.json(operadores);
  } catch (err) { handleError(res, err); }
});

// GET /:id — obtener operador por ID
router.get('/:id', async (req, res) => {
  try {
    const operador = await Operador.findById(req.params.id);
    if (!operador) return res.status(404).json({ error: 'Operador no encontrado' });
    res.json(operador);
  } catch (err) { handleError(res, err); }
});

// PUT /:id — reemplazo completo
router.put('/:id', async (req, res) => {
  try {
    const operador = await Operador.findByIdAndUpdate(
      req.params.id,
      req.body,
      { overwrite: true, new: true, runValidators: true }
    );
    if (!operador) return res.status(404).json({ error: 'Operador no encontrado' });
    res.json(operador);
  } catch (err) { handleError(res, err); }
});

module.exports = router;

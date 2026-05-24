const express = require('express');
const mongoose = require('mongoose');
const Vehiculo = require('../models/Vehiculo');

const router = express.Router();

const ESTADOS_VALIDOS = Vehiculo.schema.path('estadoActual').enumValues;
// → ['disponible', 'en_ruta', 'detenido', 'entregando', 'mantenimiento']

function handleError(res, err) {
  if (err.code === 11000) {
    return res.status(400).json({ error: 'La placa ya existe' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID inválido' });
  }
  return res.status(500).json({ error: 'Error interno del servidor' });
}

// POST / — crear vehículo
router.post('/', async (req, res) => {
  try {
    const vehiculo = await new Vehiculo(req.body).save();
    res.status(201).json(vehiculo);
  } catch (err) {
    handleError(res, err);
  }
});

// GET / — listar vehículos
router.get('/', async (req, res) => {
  try {
    const vehiculos = await Vehiculo.find();
    res.json(vehiculos);
  } catch (err) {
    handleError(res, err);
  }
});

// GET /:id — obtener vehículo por ID
router.get('/:id', async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.params.id);
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(vehiculo);
  } catch (err) {
    handleError(res, err);
  }
});

// PUT /:id — reemplazo completo
router.put('/:id', async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { overwrite: true, new: true, runValidators: true }
    );
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(vehiculo);
  } catch (err) {
    handleError(res, err);
  }
});

// PATCH /:id/estado — cambiar estado del vehículo
router.patch('/:id/estado', async (req, res) => {
  try {
    const { estadoActual } = req.body;

    if (!estadoActual || !ESTADOS_VALIDOS.includes(estadoActual)) {
      return res.status(400).json({
        error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
      });
    }

    const vehiculo = await Vehiculo.findByIdAndUpdate(
      req.params.id,
      { $set: { estadoActual } },
      { new: true, runValidators: true }
    );

    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(vehiculo);
  } catch (err) {
    handleError(res, err);
  }
});

// PATCH /:id — actualización parcial
router.patch('/:id', async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(vehiculo);
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /:id — eliminar vehículo
router.delete('/:id', async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByIdAndDelete(req.params.id);
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json({ mensaje: 'Vehículo eliminado', id: req.params.id });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;

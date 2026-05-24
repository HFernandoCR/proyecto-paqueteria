const express = require('express');
const mongoose = require('mongoose');
const Ruta = require('../models/Ruta');

const router = express.Router();
const VEHICULOS_SERVICE_URL = process.env.VEHICULOS_SERVICE_URL || 'http://vehiculos:3001';

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

// TODO: reemplazar con implementación real en el siguiente commit
async function syncVehiculo() { return false; }

// POST /:id/asignar — vincular ruta con vehículo (bidireccional)
router.post('/:id/asignar', async (req, res) => {
  try {
    const { vehiculoId } = req.body;

    if (!vehiculoId) {
      return res.status(400).json({ error: 'vehiculoId es requerido' });
    }

    if (!mongoose.Types.ObjectId.isValid(vehiculoId)) {
      return res.status(400).json({ error: 'vehiculoId no es un ObjectId válido' });
    }

    const ruta = await Ruta.findByIdAndUpdate(
      req.params.id,
      { $set: { vehiculoAsignado: vehiculoId } },
      { new: true, runValidators: true }
    );

    if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });

    const sincronizado = await syncVehiculo(vehiculoId, ruta._id);

    if (!sincronizado) {
      return res.status(200).json({
        ruta,
        vehiculoSincronizado: false,
        warning: 'Ruta asignada pero no se pudo sincronizar con Vehiculos'
      });
    }

    return res.status(200).json({ ruta, vehiculoSincronizado: true });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /:id — obtener ruta por ID
router.get('/:id', async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.id);
    if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });
    res.json(ruta);
  } catch (err) {
    handleError(res, err);
  }
});

// PUT /:id — reemplazo completo
router.put('/:id', async (req, res) => {
  try {
    const ruta = await Ruta.findByIdAndUpdate(
      req.params.id,
      req.body,
      { overwrite: true, new: true, runValidators: true }
    );
    if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });
    res.json(ruta);
  } catch (err) {
    handleError(res, err);
  }
});

// PATCH /:id — actualización parcial
router.patch('/:id', async (req, res) => {
  try {
    const ruta = await Ruta.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });
    res.json(ruta);
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /:id — eliminar ruta
router.delete('/:id', async (req, res) => {
  try {
    const ruta = await Ruta.findByIdAndDelete(req.params.id);
    if (!ruta) return res.status(404).json({ error: 'Ruta no encontrada' });
    res.json({ mensaje: 'Ruta eliminada', id: req.params.id });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;

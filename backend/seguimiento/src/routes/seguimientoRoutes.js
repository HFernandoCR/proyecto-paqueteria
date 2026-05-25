const express = require('express');
const router = express.Router();
const seguimientoController = require('../controllers/seguimientoController');

// GET /:vehiculoId/historial -> Obtiene vehículo y su historial de posiciones
router.get('/:vehiculoId/historial', seguimientoController.getHistorialVehiculo);

// GET /:vehiculoId -> Obtiene vehículo y su última ubicación
router.get('/:vehiculoId', seguimientoController.getEstadoTiempoReal);

module.exports = router;

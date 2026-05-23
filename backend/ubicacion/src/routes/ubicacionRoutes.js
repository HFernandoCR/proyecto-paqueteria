const express = require('express');
const router = express.Router();
const ubicacionController = require('../controllers/ubicacionController');

router.get('/actual/:vehiculoId', ubicacionController.getActual);
router.get('/historial/:vehiculoId', ubicacionController.getHistorial);

module.exports = router;

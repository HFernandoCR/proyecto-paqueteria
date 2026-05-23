const express = require('express');
const router = express.Router();
const simuladorController = require('../controllers/simuladorController');

router.post('/start/:vehiculoId', simuladorController.start);
router.post('/stop/:vehiculoId', simuladorController.stop);
router.get('/status', simuladorController.getStatus);

module.exports = router;

const express = require('express');
const { fetchVehiculos, fetchHistorial } = require('../helpers/http');

const router = express.Router();
const UMBRAL_DETENIDO_MIN = 15;

router.get('/anomalias', async (req, res) => {
  try {
    const vehiculos = await fetchVehiculos();
    const anomalias = [];
    const ahora = Date.now();

    for (const v of vehiculos) {
      if (!['en_ruta', 'entregando'].includes(v.estadoActual)) continue;
      const historial = await fetchHistorial(v._id);
      if (historial.length === 0) continue;

      const ultimo = historial.reduce((a, b) =>
        new Date(a.timestamp) > new Date(b.timestamp) ? a : b
      );
      const minutosDetenido = (ahora - new Date(ultimo.timestamp)) / 60000;

      if (minutosDetenido > UMBRAL_DETENIDO_MIN) {
        anomalias.push({
          vehiculoId: v._id,
          placa: v.placa,
          minutosDetenido: Math.round(minutosDetenido),
        });
      }
    }

    res.json({ anomalias, total: anomalias.length });
  } catch (err) {
    res.status(503).json({ error: 'No se pudo calcular anomalías', detalle: err.message });
  }
});

module.exports = router;

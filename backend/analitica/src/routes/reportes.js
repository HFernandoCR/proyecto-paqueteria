const express = require('express');
const { fetchVehiculos, fetchHistoriales } = require('../helpers/http');

const router = express.Router();
const UMBRAL_DETENIDO_MIN = 15;
const UMBRAL_COORD = 0.0001; // diferencia mínima en grados para considerar movimiento

router.get('/anomalias', async (req, res) => {
  try {
    const vehiculos = await fetchVehiculos();
    const vehiculosActivos = vehiculos.filter((v) =>
      ['en_ruta', 'entregando'].includes(v.estadoActual)
    );
    const historiales = await fetchHistoriales(
      vehiculosActivos.map((v) => String(v._id)),
      { limit: 2, fields: 'lat,lng,timestamp' }
    );
    const anomalias = [];
    const ahora = Date.now();

    for (const v of vehiculosActivos) {
      // Sin al menos 2 puntos no podemos determinar si hubo movimiento
      const historial = historiales[String(v._id)] || [];
      if (historial.length < 2) continue;

      // historial viene ordenado desc: [0] = más reciente, [1] = anterior
      const [ultimo, penultimo] = historial;

      const latDiff = Math.abs(ultimo.lat - penultimo.lat);
      const lngDiff = Math.abs(ultimo.lng - penultimo.lng);
      const coordenadasEstancadas = latDiff < UMBRAL_COORD && lngDiff < UMBRAL_COORD;

      // Si las coordenadas cambiaron, el vehículo se está moviendo → no es anomalía
      if (!coordenadasEstancadas) continue;

      // Las coordenadas no cambiaron. Verificar cuánto tiempo llevan así.
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

const express = require('express');
const { fetchVehiculos, fetchHistorial } = require('../helpers/http');
const { calcularDistanciaKm } = require('../helpers/geo');

const router = express.Router();

router.get('/resumen', async (req, res) => {
  try {
    const vehiculos = await fetchVehiculos();
    const vehiculosTotal = vehiculos.length;
    const vehiculosActivos = vehiculos.filter(
      (v) => ['en_ruta', 'entregando'].includes(v.estadoActual)
    ).length;
    const vehiculosDetenidos = vehiculos.filter(
      (v) => v.estadoActual === 'detenido'
    ).length;
    const entregasHoy = vehiculos.filter(
      (v) => v.estadoActual === 'entregando'
    ).length;

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    let kmRecorridosHoy = 0;
    for (const v of vehiculos) {
      const historial = await fetchHistorial(v._id);
      const puntosHoy = historial.filter((p) => new Date(p.timestamp) >= hoyInicio);
      kmRecorridosHoy += calcularDistanciaKm(puntosHoy);
    }

    res.json({
      vehiculosActivos,
      vehiculosTotal,
      kmRecorridosHoy: +kmRecorridosHoy.toFixed(1),
      entregasHoy,
      vehiculosDetenidos,
    });
  } catch (err) {
    res.status(503).json({ error: 'No se pudo calcular el resumen', detalle: err.message });
  }
});

router.get('/km-por-vehiculo', async (req, res) => {
  try {
    const vehiculos = await fetchVehiculos();
    const datos = [];
    for (const v of vehiculos) {
      const historial = await fetchHistorial(v._id);
      datos.push({
        vehiculoId: v._id,
        placa: v.placa,
        kmTotal: calcularDistanciaKm(historial),
      });
    }
    res.json({ datos });
  } catch (err) {
    res.status(503).json({ error: 'No se pudo calcular km por vehículo', detalle: err.message });
  }
});

router.get('/entregas-por-dia', async (req, res) => {
  try {
    const vehiculos = await fetchVehiculos();
    const porDia = {};
    for (const v of vehiculos) {
      const historial = await fetchHistorial(v._id);
      for (const punto of historial) {
        const fecha = new Date(punto.timestamp).toISOString().split('T')[0];
        if (!porDia[fecha]) porDia[fecha] = new Set();
        porDia[fecha].add(String(v._id));
      }
    }
    const datos = Object.entries(porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, vehiculosSet]) => ({ fecha, entregas: vehiculosSet.size }));
    res.json({ datos });
  } catch (err) {
    res.status(503).json({ error: 'No se pudo calcular entregas por día', detalle: err.message });
  }
});

module.exports = router;

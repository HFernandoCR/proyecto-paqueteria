const express = require('express');
const { fetchVehiculos, fetchHistorial, fetchRuta } = require('../helpers/http');
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

router.get('/tiempo-por-ruta', async (req, res) => {
  try {
    const vehiculos = await fetchVehiculos();
    const porRuta = {};
    for (const v of vehiculos) {
      if (!v.rutaAsignadaId) continue;
      const historial = await fetchHistorial(v._id);
      if (historial.length < 2) continue;
      const sorted = [...historial].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      const minutos =
        (new Date(sorted[sorted.length - 1].timestamp) - new Date(sorted[0].timestamp)) / 60000;
      const id = String(v.rutaAsignadaId);
      if (!porRuta[id]) porRuta[id] = [];
      porRuta[id].push(minutos);
    }
    const datos = [];
    for (const [rutaId, tiempos] of Object.entries(porRuta)) {
      const ruta = await fetchRuta(rutaId);
      const nombre = ruta?.nombre || `Ruta ${rutaId}`;
      const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      datos.push({ rutaId, nombre, tiempoPromedioMin: Math.round(promedio) });
    }
    res.json({ datos });
  } catch (err) {
    res.status(503).json({ error: 'No se pudo calcular tiempo por ruta', detalle: err.message });
  }
});

module.exports = router;

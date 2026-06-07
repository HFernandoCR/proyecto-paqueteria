const express = require('express');
const { fetchVehiculos, fetchHistoriales, fetchRuta } = require('../helpers/http');
const { calcularDistanciaKm } = require('../helpers/geo');

const router = express.Router();
const HISTORIAL_FIELDS = 'lat,lng,timestamp';

function inicioDelDia(date = new Date()) {
  const inicio = new Date(date);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function parseDias(value, fallback = 30) {
  const dias = parseInt(value, 10);
  if (!Number.isFinite(dias) || dias <= 0) return fallback;
  return Math.min(dias, 180);
}

function inicioHaceDias(dias) {
  const inicio = inicioDelDia();
  inicio.setDate(inicio.getDate() - (dias - 1));
  return inicio;
}

function idsVehiculos(vehiculos) {
  return vehiculos.map((v) => String(v._id));
}

router.get('/resumen', async (req, res) => {
  try {
    const vehiculos = await fetchVehiculos();
    const historiales = await fetchHistoriales(idsVehiculos(vehiculos), {
      desde: inicioDelDia(),
      fields: HISTORIAL_FIELDS,
    });

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

    const kmRecorridosHoy = vehiculos.reduce(
      (total, v) => total + calcularDistanciaKm(historiales[String(v._id)] || []),
      0
    );

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
    const dias = parseDias(req.query.dias);
    const vehiculos = await fetchVehiculos();
    const historiales = await fetchHistoriales(idsVehiculos(vehiculos), {
      desde: inicioHaceDias(dias),
      fields: HISTORIAL_FIELDS,
    });

    const datos = vehiculos.map((v) => ({
      vehiculoId: v._id,
      placa: v.placa,
      kmTotal: calcularDistanciaKm(historiales[String(v._id)] || []),
    }));

    res.json({ datos });
  } catch (err) {
    res.status(503).json({ error: 'No se pudo calcular km por vehículo', detalle: err.message });
  }
});

router.get('/entregas-por-dia', async (req, res) => {
  try {
    const dias = parseDias(req.query.dias);
    const vehiculos = await fetchVehiculos();
    const historiales = await fetchHistoriales(idsVehiculos(vehiculos), {
      desde: inicioHaceDias(dias),
      fields: 'timestamp',
    });
    const porDia = {};
    for (const v of vehiculos) {
      const historial = historiales[String(v._id)] || [];
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
    const dias = parseDias(req.query.dias);
    const vehiculos = await fetchVehiculos();
    const vehiculosConRuta = vehiculos.filter((v) => v.rutaAsignadaId);
    const historiales = await fetchHistoriales(idsVehiculos(vehiculosConRuta), {
      desde: inicioHaceDias(dias),
      fields: 'timestamp',
    });
    const porRuta = {};
    for (const v of vehiculosConRuta) {
      const historial = historiales[String(v._id)] || [];
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

    const datos = await Promise.all(Object.entries(porRuta).map(async ([rutaId, tiempos]) => {
      const ruta = await fetchRuta(rutaId);
      const nombre = ruta?.nombre || `Ruta ${rutaId}`;
      const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      return { rutaId, nombre, tiempoPromedioMin: Math.round(promedio) };
    }));

    res.json({ datos });
  } catch (err) {
    res.status(503).json({ error: 'No se pudo calcular tiempo por ruta', detalle: err.message });
  }
});

module.exports = router;

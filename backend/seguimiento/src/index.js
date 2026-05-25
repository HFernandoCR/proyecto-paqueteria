const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/db_seguimiento';

app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('[seguimiento] MongoDB conectado: ' + MONGO_URI))
  .catch((err) => console.error('[seguimiento] Error MongoDB:', err.message));

const VEHICULOS_SERVICE_URL = process.env.VEHICULOS_SERVICE_URL || 'http://localhost:3001';
const UBICACION_SERVICE_URL = process.env.UBICACION_SERVICE_URL || 'http://localhost:3003';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'seguimiento' });
});

app.get('/activos', async (req, res) => {
  try {
    const vRes = await fetch(`${VEHICULOS_SERVICE_URL}/vehiculos`);
    if (!vRes.ok) {
      throw new Error(`Error en servicio de vehículos: ${vRes.status}`);
    }
    const vehiculos = await vRes.json();

    const activos = vehiculos.filter(v => ['en_ruta', 'entregando'].includes(v.estadoActual));

    const activosConUbicacion = await Promise.all(
      activos.map(async (v) => {
        try {
          const uRes = await fetch(`${UBICACION_SERVICE_URL}/ubicaciones/actual/${v._id}`);
          if (uRes.ok) {
            const ubicacion = await uRes.json();
            return {
              _id: v._id,
              placa: v.placa,
              modelo: v.modelo,
              estadoActual: v.estadoActual,
              lat: ubicacion.lat,
              lng: ubicacion.lng,
              velocidadKmh: ubicacion.velocidadKmh || 0,
              bearing: ubicacion.bearing || 0,
              timestamp: ubicacion.timestamp
            };
          }
        } catch (err) {
          console.error(`Error al obtener ubicación para vehículo ${v._id}:`, err.message);
        }
        
        return {
          _id: v._id,
          placa: v.placa,
          modelo: v.modelo,
          estadoActual: v.estadoActual,
          lat: 19.4326 + (Math.random() - 0.5) * 0.1,
          lng: -99.1332 + (Math.random() - 0.5) * 0.1,
          velocidadKmh: 0,
          bearing: 0,
          timestamp: new Date()
        };
      })
    );

    res.json(activosConUbicacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vehículos activos', detalle: error.message });
  }
});

app.listen(PORT, () => {
  console.log('[seguimiento] Servidor escuchando en puerto ' + PORT);
});

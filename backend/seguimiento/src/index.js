const express = require('express');
const mongoose = require('mongoose');
const seguimientoRoutes = require('./routes/seguimientoRoutes');

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

// Rutas de seguimiento
app.use('/seguimiento', seguimientoRoutes);


app.listen(PORT, () => {
  console.log('[seguimiento] Servidor escuchando en puerto ' + PORT);
});

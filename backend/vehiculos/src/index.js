const express = require('express');
const mongoose = require('mongoose');
const vehiculosRouter = require('./routes/vehiculos');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/db_vehiculos';

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vehiculos' });
});

app.use('/', vehiculosRouter);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('[vehiculos] MongoDB conectado: ' + MONGO_URI))
  .catch((err) => console.error('[vehiculos] Error MongoDB:', err.message));

app.listen(PORT, () => {
  console.log('[vehiculos] Servidor escuchando en puerto ' + PORT);
});

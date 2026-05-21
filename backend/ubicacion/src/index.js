const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/db_ubicacion';

app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('[ubicacion] MongoDB conectado: ' + MONGO_URI))
  .catch((err) => console.error('[ubicacion] Error MongoDB:', err.message));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ubicacion' });
});

app.listen(PORT, () => {
  console.log('[ubicacion] Servidor escuchando en puerto ' + PORT);
});

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3006;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/db_notificaciones';

app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('[notificaciones] MongoDB conectado: ' + MONGO_URI))
  .catch((err) => console.error('[notificaciones] Error MongoDB:', err.message));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notificaciones' });
});

app.listen(PORT, () => {
  console.log('[notificaciones] Servidor escuchando en puerto ' + PORT);
});

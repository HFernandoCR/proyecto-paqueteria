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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'seguimiento' });
});

app.listen(PORT, () => {
  console.log('[seguimiento] Servidor escuchando en puerto ' + PORT);
});

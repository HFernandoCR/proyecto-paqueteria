const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/db_analitica';

app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('[analitica] MongoDB conectado: ' + MONGO_URI))
  .catch((err) => console.error('[analitica] Error MongoDB:', err.message));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analitica' });
});

app.listen(PORT, () => {
  console.log('[analitica] Servidor escuchando en puerto ' + PORT);
});

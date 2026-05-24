const express = require('express');
const mongoose = require('mongoose');
const rutasRouter = require('./routes/rutas');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/db_rutas';

app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('[rutas] MongoDB conectado: ' + MONGO_URI))
  .catch((err) => console.error('[rutas] Error MongoDB:', err.message));

// /health registrado antes del router para que GET /:id no lo intercepte
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rutas' });
});
app.use('/rutas', rutasRouter);

app.listen(PORT, () => {
  console.log('[rutas] Servidor escuchando en puerto ' + PORT);
});

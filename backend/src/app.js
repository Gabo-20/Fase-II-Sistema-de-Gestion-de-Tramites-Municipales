const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/tramites',       require('./routes/tramites'));
app.use('/api/tipos-tramite',  require('./routes/tiposTramite'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/usuarios',       require('./routes/usuarios'));
app.use('/api/dashboard',      require('./routes/dashboard'));

module.exports = app;

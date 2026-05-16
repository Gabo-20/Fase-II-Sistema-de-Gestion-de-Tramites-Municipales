const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const header = req.headers.authorization;
  // Permite token como query param para descargas (window.open no puede enviar headers)
  const queryToken = req.query.token;

  if (!header && !queryToken) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header ? header.slice(7) : queryToken;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.sub, rol: payload.rol };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function soloRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }
    next();
  };
}

module.exports = { verificarToken, soloRoles };

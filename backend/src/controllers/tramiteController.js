const tramiteService = require('../services/tramiteService');

async function crearSolicitud(req, res) {
  try {
    const solicitud = await tramiteService.crearSolicitud({
      ciudadanoId: req.usuario.id,
      tipoTramiteId: req.body.tipoTramiteId,
      referencia: req.body.referencia,
    });
    res.status(201).json({ message: 'Solicitud creada', solicitud });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function listarSolicitudes(req, res) {
  try {
    const esCiudadano = req.usuario.rol === 'CIUDADANO';
    const solicitudes = esCiudadano
      ? await tramiteService.listarSolicitudesCiudadano(req.usuario.id)
      : await tramiteService.listarTodasSolicitudes(req.query);
    res.json(solicitudes);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function obtenerSolicitud(req, res) {
  try {
    const solicitud = await tramiteService.obtenerSolicitud(
      req.params.id,
      req.usuario.rol === 'CIUDADANO' ? req.usuario.id : null
    );
    res.json(solicitud);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function resolverSolicitud(req, res) {
  try {
    const solicitud = await tramiteService.resolverSolicitud({
      id: req.params.id,
      funcionarioId: req.usuario.id,
      accion: req.body.accion,
      comentario: req.body.comentario,
    });
    res.json({ message: 'Solicitud actualizada', solicitud });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function agregarObservacion(req, res) {
  try {
    const observacion = await tramiteService.agregarObservacion({
      id: req.params.id,
      comentario: req.body.comentario,
    });
    res.status(201).json({ message: 'Observación registrada', observacion });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function renovarLicencia(req, res) {
  try {
    const solicitud = await tramiteService.renovarLicencia({
      solicitudId: req.params.id,
      ciudadanoId: req.usuario.id,
    });
    res.status(201).json({ message: 'Renovación creada', solicitud });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  crearSolicitud,
  listarSolicitudes,
  obtenerSolicitud,
  resolverSolicitud,
  agregarObservacion,
  renovarLicencia,
};

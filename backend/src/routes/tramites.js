const { Router } = require('express');
const {
  crearSolicitud,
  listarSolicitudes,
  obtenerSolicitud,
  resolverSolicitud,
  agregarObservacion,
  renovarLicencia,
  crearMultaParaCiudadano,
} = require('../controllers/tramiteController');
const { verificarToken, soloRoles } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);

// Solo ciudadanos pueden crear y renovar solicitudes
router.post('/',            soloRoles('CIUDADANO'), crearSolicitud);
router.post('/:id/renovar', soloRoles('CIUDADANO'), renovarLicencia);

// Todos los autenticados
router.get('/',                                                         listarSolicitudes);
router.get('/:id',                                                      obtenerSolicitud);

// Operador+
router.post('/multa-ciudadano', soloRoles('OPERADOR','SUPERVISOR','ADMIN'), crearMultaParaCiudadano);
router.patch('/:id/resolucion', soloRoles('OPERADOR','SUPERVISOR','ADMIN'), resolverSolicitud);
router.post('/:id/observaciones', soloRoles('OPERADOR','SUPERVISOR','ADMIN'), agregarObservacion);

module.exports = router;

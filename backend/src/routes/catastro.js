const router = require('express').Router();
const { verificarToken, soloRoles } = require('../middlewares/auth');
const {
  listarInmuebles,
  obtenerInmueble,
  crearInmueble,
  actualizarPropietario,
} = require('../services/catastroService');

router.use(verificarToken, soloRoles('OPERADOR', 'SUPERVISOR', 'ADMIN'));

// GET /api/catastro?busqueda=...
router.get('/', async (req, res) => {
  try {
    const inmuebles = await listarInmuebles({ busqueda: req.query.busqueda });
    res.json(inmuebles);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/catastro/:id
router.get('/:id', async (req, res) => {
  try {
    const inmueble = await obtenerInmueble(req.params.id);
    res.json(inmueble);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/catastro
router.post('/', async (req, res) => {
  try {
    const inmueble = await crearInmueble(req.body);
    res.status(201).json({ message: 'Inmueble registrado', inmueble });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PATCH /api/catastro/:id/propietario
router.patch('/:id/propietario', async (req, res) => {
  try {
    const inmueble = await actualizarPropietario({
      id:               req.params.id,
      propietarioNuevo: req.body.propietarioNuevo,
      funcionarioId:    req.usuario.id,
      motivo:           req.body.motivo,
    });
    res.json({ message: 'Propietario actualizado', inmueble });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;

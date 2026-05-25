const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verificarToken, soloRoles } = require('../middlewares/auth');

const prisma = new PrismaClient();

// GET /api/usuarios/ciudadanos — lista ciudadanos (OPERADOR+)
router.get('/ciudadanos', verificarToken, soloRoles('OPERADOR', 'SUPERVISOR', 'ADMIN'), async (req, res) => {
  try {
    const ciudadanos = await prisma.usuario.findMany({
      where: { rol: 'CIUDADANO', activo: true },
      select: { id: true, nombre: true, correo: true, dpi: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(ciudadanos);
  } catch {
    res.status(500).json({ error: 'Error al obtener ciudadanos' });
  }
});

// GET /api/usuarios — lista todos los usuarios (ADMIN)
router.get('/', verificarToken, soloRoles('ADMIN'), async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, correo: true, dpi: true, rol: true, activo: true, creadoEn: true },
      orderBy: { creadoEn: 'desc' },
    });
    res.json(usuarios);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// PATCH /api/usuarios/:id/rol — cambiar rol (ADMIN)
router.patch('/:id/rol', verificarToken, soloRoles('ADMIN'), async (req, res) => {
  try {
    const { rol } = req.body;
    const rolesValidos = ['CIUDADANO', 'OPERADOR', 'SUPERVISOR', 'ADMIN'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ error: 'Rol no válido' });
    }
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }
    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data: { rol },
      select: { id: true, nombre: true, correo: true, rol: true },
    });
    res.json({ message: 'Rol actualizado', usuario });
  } catch {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

// PATCH /api/usuarios/:id/estado — activar/desactivar usuario (ADMIN)
router.patch('/:id/estado', verificarToken, soloRoles('ADMIN'), async (req, res) => {
  try {
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }
    const { activo } = req.body;
    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data: { activo: Boolean(activo) },
      select: { id: true, nombre: true, correo: true, rol: true, activo: true },
    });
    res.json({ message: 'Estado actualizado', usuario });
  } catch {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

module.exports = router;

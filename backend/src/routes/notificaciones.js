const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verificarToken } = require('../middlewares/auth');

const prisma = new PrismaClient();

// GET /api/notificaciones
// CIUDADANO → cambios en sus solicitudes
// OPERADOR+ → últimos 50 cambios en todas las solicitudes
router.get('/', verificarToken, async (req, res) => {
  try {
    const esCiudadano = req.usuario.rol === 'CIUDADANO';

    const historial = await prisma.historialEstado.findMany({
      where: esCiudadano
        ? { solicitud: { ciudadanoId: req.usuario.id } }
        : {},
      include: {
        solicitud: {
          select: {
            id: true,
            numeroExpediente: true,
            tipoTramite: { select: { nombre: true } },
            ciudadano: esCiudadano ? false : { select: { nombre: true, correo: true } },
          },
        },
      },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    });

    res.json(historial);
  } catch {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// GET /api/notificaciones/badges
// Devuelve conteos de acciones pendientes según el rol del usuario
router.get('/badges', verificarToken, async (req, res) => {
  try {
    const { id, rol } = req.usuario
    let result = { total: 0 }

    if (rol === 'CIUDADANO') {
      const multas = await prisma.solicitud.count({
        where: {
          ciudadanoId: id,
          estado: 'RECIBIDA',
          tipoTramite: { nombre: { contains: 'Multa' } },
        },
      })
      result = { total: multas, multas }

    } else if (rol === 'OPERADOR') {
      const nuevas = await prisma.solicitud.count({ where: { estado: 'RECIBIDA' } })
      result = { total: nuevas, nuevas }

    } else if (rol === 'SUPERVISOR') {
      const porRevisar = await prisma.solicitud.count({ where: { estado: 'EN_REVISION' } })
      result = { total: porRevisar, porRevisar }

    } else if (rol === 'ADMIN') {
      const [nuevas, porRevisar] = await Promise.all([
        prisma.solicitud.count({ where: { estado: 'RECIBIDA' } }),
        prisma.solicitud.count({ where: { estado: 'EN_REVISION' } }),
      ])
      result = { total: nuevas + porRevisar, nuevas, porRevisar }
    }

    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al obtener badges' })
  }
})

module.exports = router;

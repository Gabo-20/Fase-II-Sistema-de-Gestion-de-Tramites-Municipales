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

const norm = s => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const MODULO_KEYWORDS = {
  licencias:    ['licencia comercial', 'licencia nueva', 'renovacion', 'licencia'],
  construccion: ['construccion', 'permiso de construccion', 'ampliacion', 'remodelacion', 'obra'],
  iusi:         ['iusi', 'impuesto unico', 'impuesto'],
  solvencia:    ['solvencia'],
  multas:       ['multa'],
  residencia:   ['residencia', 'constancia de residencia'],
  rotulo:       ['rotulo', 'rotulos', 'publicidad'],
  temporales:   ['temporal', 'licencia temporal'],
}

function clasificarModulo(nombreTipo) {
  const n = norm(nombreTipo)
  for (const [modulo, keywords] of Object.entries(MODULO_KEYWORDS)) {
    if (keywords.some(k => n.includes(norm(k)))) return modulo
  }
  return 'otros'
}

// GET /api/notificaciones/badges
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

      const desde = req.query.desde ? new Date(req.query.desde) : null
      const notificaciones = desde
        ? await prisma.historialEstado.count({
            where: { solicitud: { ciudadanoId: id }, creadoEn: { gt: desde } },
          })
        : await prisma.historialEstado.count({
            where: { solicitud: { ciudadanoId: id } },
          })

      result = { total: multas, multas, notificaciones }

    } else {
      // OPERADOR ve RECIBIDA, SUPERVISOR ve EN_REVISION, ADMIN ve ambas
      const estadosFiltro =
        rol === 'OPERADOR'   ? ['RECIBIDA'] :
        rol === 'SUPERVISOR' ? ['EN_REVISION'] :
        ['RECIBIDA', 'EN_REVISION']

      const pendientes = await prisma.solicitud.findMany({
        where: { estado: { in: estadosFiltro } },
        select: { estado: true, tipoTramite: { select: { nombre: true } } },
      })

      const porModulo = {}
      pendientes.forEach(s => {
        const modulo = clasificarModulo(s.tipoTramite.nombre)
        porModulo[modulo] = (porModulo[modulo] ?? 0) + 1
      })

      const nuevas    = pendientes.filter(s => s.estado === 'RECIBIDA').length
      const porRevisar = pendientes.filter(s => s.estado === 'EN_REVISION').length

      result = { total: pendientes.length, nuevas, porRevisar, porModulo }
    }

    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al obtener badges' })
  }
})

module.exports = router;

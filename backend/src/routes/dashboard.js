const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verificarToken, soloRoles } = require('../middlewares/auth');

const prisma = new PrismaClient();

// GET /api/dashboard/stats — solo OPERADOR, SUPERVISOR, ADMIN
router.get('/stats', verificarToken, soloRoles('OPERADOR', 'SUPERVISOR', 'ADMIN'), async (req, res) => {
  try {
    const [
      totalSolicitudes,
      porEstado,
      porTipo,
      totalUsuarios,
      usuariosPorRol,
      recientes,
    ] = await Promise.all([

      // Total de solicitudes
      prisma.solicitud.count(),

      // Conteo por estado
      prisma.solicitud.groupBy({
        by: ['estado'],
        _count: { estado: true },
      }),

      // Conteo por tipo de trámite (top 8)
      prisma.solicitud.groupBy({
        by: ['tipoTramiteId'],
        _count: { tipoTramiteId: true },
        orderBy: { _count: { tipoTramiteId: 'desc' } },
        take: 8,
      }),

      // Total usuarios
      prisma.usuario.count(),

      // Usuarios por rol
      prisma.usuario.groupBy({
        by: ['rol'],
        _count: { rol: true },
      }),

      // Últimas 5 solicitudes recientes
      prisma.solicitud.findMany({
        take: 5,
        orderBy: { fechaSolicitud: 'desc' },
        include: {
          tipoTramite: { select: { nombre: true } },
          ciudadano: { select: { nombre: true, correo: true } },
        },
      }),
    ]);

    // Enriquecer porTipo con el nombre del tipo de trámite
    const tipoIds = porTipo.map(t => t.tipoTramiteId);
    const tipos = await prisma.tipoTramite.findMany({
      where: { id: { in: tipoIds } },
      select: { id: true, nombre: true },
    });
    const tiposMap = Object.fromEntries(tipos.map(t => [t.id, t.nombre]));

    const porTipoConNombre = porTipo.map(t => ({
      nombre: tiposMap[t.tipoTramiteId] ?? 'Desconocido',
      total: t._count.tipoTramiteId,
    }));

    res.json({
      totalSolicitudes,
      totalUsuarios,
      porEstado: porEstado.map(e => ({
        estado: e.estado,
        total: e._count.estado,
      })),
      porTipo: porTipoConNombre,
      usuariosPorRol: usuariosPorRol.map(u => ({
        rol: u.rol,
        total: u._count.rol,
      })),
      recientes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;

const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verificarToken, soloRoles } = require('../middlewares/auth');

const prisma = new PrismaClient();

// US14 — GET /api/reportes/historial/:ciudadanoId
// Historial completo de trámites de un ciudadano (OPERADOR+ o el propio ciudadano)
router.get('/historial/:ciudadanoId', verificarToken, async (req, res) => {
  try {
    const { ciudadanoId } = req.params;
    const esCiudadano = req.usuario.rol === 'CIUDADANO';

    // Ciudadano solo puede ver su propio historial
    if (esCiudadano && req.usuario.id !== ciudadanoId) {
      return res.status(403).json({ error: 'Sin permisos para ver este historial' });
    }

    const solicitudes = await prisma.solicitud.findMany({
      where: { ciudadanoId },
      include: {
        tipoTramite: { select: { nombre: true } },
        funcionario: { select: { nombre: true } },
        historial:   { orderBy: { creadoEn: 'asc' } },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });

    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// US15 — GET /api/reportes/solicitudes?desde=&hasta=&estado=&tipoTramiteId=
// Reporte de solicitudes por período — solo OPERADOR+
router.get('/solicitudes', verificarToken, soloRoles('OPERADOR', 'SUPERVISOR', 'ADMIN'), async (req, res) => {
  try {
    const { desde, hasta, estado, tipoTramiteId } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (tipoTramiteId) where.tipoTramiteId = Number(tipoTramiteId);
    if (desde || hasta) {
      where.fechaSolicitud = {};
      if (desde) where.fechaSolicitud.gte = new Date(desde);
      if (hasta) {
        const fechaHasta = new Date(hasta);
        fechaHasta.setHours(23, 59, 59, 999);
        where.fechaSolicitud.lte = fechaHasta;
      }
    }

    const solicitudes = await prisma.solicitud.findMany({
      where,
      include: {
        tipoTramite: { select: { nombre: true } },
        ciudadano:   { select: { nombre: true, correo: true, dpi: true } },
        funcionario: { select: { nombre: true } },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });

    // Resumen estadístico
    const resumen = solicitudes.reduce((acc, s) => {
      acc[s.estado] = (acc[s.estado] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total: solicitudes.length,
      resumen,
      solicitudes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// GET /api/reportes/solicitudes/export?desde=&hasta=&estado=&tipoTramiteId=&formato=csv
// Exporta el reporte como CSV — solo OPERADOR+
router.get('/solicitudes/export', verificarToken, soloRoles('OPERADOR', 'SUPERVISOR', 'ADMIN'), async (req, res) => {
  try {
    const { desde, hasta, estado, tipoTramiteId, formato = 'csv' } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (tipoTramiteId) where.tipoTramiteId = Number(tipoTramiteId);
    if (desde || hasta) {
      where.fechaSolicitud = {};
      if (desde) where.fechaSolicitud.gte = new Date(desde);
      if (hasta) {
        const fechaHasta = new Date(hasta);
        fechaHasta.setHours(23, 59, 59, 999);
        where.fechaSolicitud.lte = fechaHasta;
      }
    }

    const solicitudes = await prisma.solicitud.findMany({
      where,
      include: {
        tipoTramite: { select: { nombre: true } },
        ciudadano:   { select: { nombre: true, correo: true, dpi: true } },
        funcionario: { select: { nombre: true } },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });

    const encabezado = 'Expediente,Tipo,Ciudadano,DPI,Correo,Estado,Funcionario,Fecha Solicitud,Fecha Resolución';
    const filas = solicitudes.map(s => [
      s.numeroExpediente,
      s.tipoTramite?.nombre ?? '',
      s.ciudadano?.nombre ?? '',
      s.ciudadano?.dpi ?? '',
      s.ciudadano?.correo ?? '',
      s.estado,
      s.funcionario?.nombre ?? '',
      new Date(s.fechaSolicitud).toLocaleDateString('es-GT'),
      s.fechaResolucion ? new Date(s.fechaResolucion).toLocaleDateString('es-GT') : '',
    ].map(v => `"${v}"`).join(','));

    const csv = [encabezado, ...filas].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-tramites-${Date.now()}.csv"`);
    res.send('﻿' + csv); // BOM para que Excel lo abra bien
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar reporte' });
  }
});

module.exports = router;

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function generarExpediente() {
  const anio = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `EXP-${anio}-${random}`;
}

async function crearSolicitud({ ciudadanoId, tipoTramiteId, referencia }) {
  if (!tipoTramiteId) {
    throw Object.assign(new Error('tipoTramiteId es requerido'), { status: 400 });
  }

  const tipo = await prisma.tipoTramite.findUnique({ where: { id: Number(tipoTramiteId) } });
  if (!tipo || !tipo.activo) {
    throw Object.assign(new Error('Tipo de trámite no válido'), { status: 404 });
  }

  const solicitud = await prisma.solicitud.create({
    data: {
      numeroExpediente: generarExpediente(),
      ciudadanoId,
      tipoTramiteId: Number(tipoTramiteId),
      referencia: referencia ?? null,
      estado: 'RECIBIDA',
    },
    include: {
      tipoTramite: { select: { id: true, nombre: true } },
    },
  });

  await prisma.historialEstado.create({
    data: {
      solicitudId: solicitud.id,
      estado: 'RECIBIDA',
      comentario: 'Solicitud recibida',
    },
  });

  return solicitud;
}

async function listarSolicitudesCiudadano(ciudadanoId) {
  return prisma.solicitud.findMany({
    where: { ciudadanoId },
    include: { tipoTramite: { select: { id: true, nombre: true } } },
    orderBy: { fechaSolicitud: 'desc' },
  });
}

// OPERADOR+ ve todas las solicitudes con filtros opcionales
async function listarTodasSolicitudes({ estado, tipoTramiteId } = {}) {
  const where = {};
  if (estado) where.estado = estado;
  if (tipoTramiteId) where.tipoTramiteId = Number(tipoTramiteId);

  return prisma.solicitud.findMany({
    where,
    include: {
      tipoTramite: { select: { id: true, nombre: true } },
      ciudadano: { select: { id: true, nombre: true, correo: true, dpi: true } },
      funcionario: { select: { id: true, nombre: true } },
    },
    orderBy: { fechaSolicitud: 'desc' },
  });
}

async function obtenerSolicitud(id, ciudadanoId) {
  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: {
      tipoTramite: { select: { id: true, nombre: true } },
      ciudadano: { select: { id: true, nombre: true, correo: true } },
      funcionario: { select: { id: true, nombre: true } },
      historial: { orderBy: { creadoEn: 'asc' } },
    },
  });

  if (!solicitud) {
    throw Object.assign(new Error('Solicitud no encontrada'), { status: 404 });
  }

  if (ciudadanoId && solicitud.ciudadanoId !== ciudadanoId) {
    throw Object.assign(new Error('Sin permisos para ver esta solicitud'), { status: 403 });
  }

  return solicitud;
}

// US06 — SUPERVISOR+ aprueba o rechaza, OPERADOR pone en revisión
async function resolverSolicitud({ id, funcionarioId, accion, comentario }) {
  const TRANSICIONES = {
    OPERADOR:    { EN_REVISION: ['RECIBIDA', 'SUBSANACION'] },
    SUPERVISOR:  { APROBADA: ['EN_REVISION'], RECHAZADA: ['EN_REVISION', 'RECIBIDA'], SUBSANACION: ['EN_REVISION'] },
    ADMIN:       { APROBADA: ['EN_REVISION', 'RECIBIDA'], RECHAZADA: ['EN_REVISION', 'RECIBIDA'], SUBSANACION: ['EN_REVISION'], EN_REVISION: ['RECIBIDA'] },
  };

  const estadosValidos = ['EN_REVISION', 'APROBADA', 'RECHAZADA', 'SUBSANACION'];
  if (!estadosValidos.includes(accion)) {
    throw Object.assign(new Error('Acción no válida'), { status: 400 });
  }
  if (!comentario?.trim()) {
    throw Object.assign(new Error('El comentario es requerido'), { status: 400 });
  }

  const solicitud = await prisma.solicitud.findUnique({ where: { id } });
  if (!solicitud) {
    throw Object.assign(new Error('Solicitud no encontrada'), { status: 404 });
  }

  const funcionario = await prisma.usuario.findUnique({ where: { id: funcionarioId } });
  const permitidos = TRANSICIONES[funcionario.rol]?.[accion] ?? [];
  if (!permitidos.includes(solicitud.estado)) {
    throw Object.assign(
      new Error(`No puedes cambiar de ${solicitud.estado} a ${accion}`),
      { status: 403 }
    );
  }

  const [actualizada] = await prisma.$transaction([
    prisma.solicitud.update({
      where: { id },
      data: {
        estado: accion,
        funcionarioId,
        ...(accion === 'APROBADA' || accion === 'RECHAZADA'
          ? { fechaResolucion: new Date() }
          : {}),
      },
      include: {
        tipoTramite: { select: { nombre: true } },
        ciudadano: { select: { nombre: true, correo: true } },
      },
    }),
    prisma.historialEstado.create({
      data: { solicitudId: id, estado: accion, comentario },
    }),
  ]);

  return actualizada;
}

// US09 — Observación sin cambio de estado
async function agregarObservacion({ id, comentario }) {
  if (!comentario?.trim()) {
    throw Object.assign(new Error('El comentario es requerido'), { status: 400 });
  }

  const solicitud = await prisma.solicitud.findUnique({ where: { id } });
  if (!solicitud) {
    throw Object.assign(new Error('Solicitud no encontrada'), { status: 404 });
  }

  return prisma.historialEstado.create({
    data: {
      solicitudId: id,
      estado: solicitud.estado,
      comentario: `[Observación] ${comentario}`,
    },
  });
}

// US05 — Renovar licencia (crea nueva solicitud ligada al mismo tipo)
async function renovarLicencia({ solicitudId, ciudadanoId }) {
  const original = await prisma.solicitud.findUnique({
    where: { id: solicitudId },
    include: { tipoTramite: true },
  });

  if (!original) {
    throw Object.assign(new Error('Solicitud no encontrada'), { status: 404 });
  }
  if (original.ciudadanoId !== ciudadanoId) {
    throw Object.assign(new Error('Sin permisos'), { status: 403 });
  }
  if (original.estado !== 'APROBADA') {
    throw Object.assign(new Error('Solo se pueden renovar licencias aprobadas'), { status: 400 });
  }

  const nueva = await prisma.solicitud.create({
    data: {
      numeroExpediente: generarExpediente(),
      ciudadanoId,
      tipoTramiteId: original.tipoTramiteId,
      estado: 'RECIBIDA',
    },
    include: { tipoTramite: { select: { id: true, nombre: true } } },
  });

  await prisma.historialEstado.create({
    data: {
      solicitudId: nueva.id,
      estado: 'RECIBIDA',
      comentario: `Renovación de expediente ${original.numeroExpediente}`,
    },
  });

  return nueva;
}

module.exports = {
  crearSolicitud,
  listarSolicitudesCiudadano,
  listarTodasSolicitudes,
  obtenerSolicitud,
  resolverSolicitud,
  agregarObservacion,
  renovarLicencia,
};

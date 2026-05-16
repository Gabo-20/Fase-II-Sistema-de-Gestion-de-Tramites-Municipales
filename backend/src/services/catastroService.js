const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listarInmuebles({ busqueda } = {}) {
  const where = busqueda
    ? {
        OR: [
          { numeroCatastral: { contains: busqueda } },
          { direccion:       { contains: busqueda } },
          { propietario:     { contains: busqueda } },
        ],
      }
    : {};

  return prisma.inmueble.findMany({
    where: { ...where, activo: true },
    orderBy: { numeroCatastral: 'asc' },
  });
}

async function obtenerInmueble(id) {
  const inmueble = await prisma.inmueble.findUnique({
    where: { id: Number(id) },
    include: {
      historial: { orderBy: { creadoEn: 'desc' } },
    },
  });

  if (!inmueble) {
    throw Object.assign(new Error('Inmueble no encontrado'), { status: 404 });
  }
  return inmueble;
}

async function crearInmueble({ numeroCatastral, direccion, propietario, area, valorCatastral }) {
  if (!numeroCatastral || !direccion || !propietario || !area || !valorCatastral) {
    throw Object.assign(new Error('Todos los campos son requeridos'), { status: 400 });
  }

  const existe = await prisma.inmueble.findUnique({ where: { numeroCatastral } });
  if (existe) {
    throw Object.assign(new Error('El número catastral ya está registrado'), { status: 409 });
  }

  return prisma.inmueble.create({
    data: { numeroCatastral, direccion, propietario, area, valorCatastral },
  });
}

async function actualizarPropietario({ id, propietarioNuevo, funcionarioId, motivo }) {
  if (!propietarioNuevo?.trim()) {
    throw Object.assign(new Error('El nombre del nuevo propietario es requerido'), { status: 400 });
  }

  const inmueble = await prisma.inmueble.findUnique({ where: { id: Number(id) } });
  if (!inmueble) {
    throw Object.assign(new Error('Inmueble no encontrado'), { status: 404 });
  }

  const [actualizado] = await prisma.$transaction([
    prisma.inmueble.update({
      where: { id: Number(id) },
      data: { propietario: propietarioNuevo },
    }),
    prisma.historialCatastro.create({
      data: {
        inmuebleId:          Number(id),
        propietarioAnterior: inmueble.propietario,
        propietarioNuevo,
        funcionarioId,
        motivo: motivo ?? null,
      },
    }),
  ]);

  return actualizado;
}

module.exports = { listarInmuebles, obtenerInmueble, crearInmueble, actualizarPropietario };

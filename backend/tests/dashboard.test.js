const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    solicitud:  { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
    usuario:    { count: jest.fn(), groupBy: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    tipoTramite: { findMany: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tokenAdmin    = () => jwt.sign({ sub: 'admin-uuid',  rol: 'ADMIN'    }, process.env.JWT_SECRET);
const tokenCiudadano = () => jwt.sign({ sub: 'c-uuid',     rol: 'CIUDADANO' }, process.env.JWT_SECRET);

beforeEach(() => {
  jest.clearAllMocks();
  prisma.solicitud.count.mockResolvedValue(10);
  prisma.solicitud.groupBy.mockResolvedValue([
    { estado: 'RECIBIDA', _count: { estado: 5 } },
    { estado: 'APROBADA', _count: { estado: 3 } },
  ]);
  prisma.solicitud.findMany.mockResolvedValue([]);
  prisma.usuario.count.mockResolvedValue(4);
  prisma.usuario.groupBy.mockResolvedValue([
    { rol: 'CIUDADANO', _count: { rol: 3 } },
    { rol: 'ADMIN',     _count: { rol: 1 } },
  ]);
  prisma.tipoTramite.findMany.mockResolvedValue([
    { id: 1, nombre: 'Licencia Comercial' },
  ]);
});

describe('GET /api/dashboard/stats', () => {
  test('200 — admin obtiene estadísticas', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${tokenAdmin()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalSolicitudes');
    expect(res.body).toHaveProperty('totalUsuarios');
    expect(res.body).toHaveProperty('porEstado');
    expect(res.body).toHaveProperty('porTipo');
    expect(res.body).toHaveProperty('usuariosPorRol');
    expect(res.body).toHaveProperty('recientes');
  });

  test('403 — ciudadano no puede ver stats', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(403);
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
  });
});

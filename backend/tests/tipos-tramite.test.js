const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    tipoTramite: { findMany: jest.fn() },
    usuario: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const token = () => jwt.sign({ sub: 'user-uuid', rol: 'CIUDADANO' }, process.env.JWT_SECRET);

beforeEach(() => jest.clearAllMocks());

describe('GET /api/tipos-tramite', () => {
  test('200 — lista tipos activos', async () => {
    prisma.tipoTramite.findMany.mockResolvedValue([
      { id: 1, nombre: 'Licencia Comercial', descripcion: 'Licencia para comercios' },
      { id: 2, nombre: 'Permiso de Construcción', descripcion: 'Permiso de obra' },
    ]);

    const res = await request(app)
      .get('/api/tipos-tramite')
      .set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('nombre');
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/tipos-tramite');
    expect(res.status).toBe(401);
  });
});

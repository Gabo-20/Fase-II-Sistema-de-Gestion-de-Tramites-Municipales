const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    historialEstado: { findMany: jest.fn() },
    usuario: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tokenCiudadano = () => jwt.sign({ sub: 'ciudadano-uuid', rol: 'CIUDADANO' }, process.env.JWT_SECRET);
const tokenOperador  = () => jwt.sign({ sub: 'operador-uuid',  rol: 'OPERADOR'  }, process.env.JWT_SECRET);

const historialMock = [
  {
    id: 1,
    estado: 'RECIBIDA',
    comentario: 'Solicitud recibida',
    creadoEn: new Date().toISOString(),
    solicitud: {
      id: 'sol-uuid-1',
      numeroExpediente: 'EXP-2026-123456',
      tipoTramite: { nombre: 'Licencia Comercial' },
    },
  },
];

beforeEach(() => jest.clearAllMocks());

describe('GET /api/notificaciones', () => {
  test('200 — ciudadano ve sus notificaciones', async () => {
    prisma.historialEstado.findMany.mockResolvedValue(historialMock);

    const res = await request(app)
      .get('/api/notificaciones')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].estado).toBe('RECIBIDA');
  });

  test('200 — operador ve notificaciones de todos', async () => {
    prisma.historialEstado.findMany.mockResolvedValue(historialMock);

    const res = await request(app)
      .get('/api/notificaciones')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/notificaciones');
    expect(res.status).toBe(401);
  });
});

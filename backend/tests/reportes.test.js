const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    solicitud: { findMany: jest.fn() },
    usuario:   { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tokenOperador  = () => jwt.sign({ sub: 'op-uuid', rol: 'OPERADOR'  }, process.env.JWT_SECRET);
const tokenCiudadano = () => jwt.sign({ sub: 'c-uuid',  rol: 'CIUDADANO' }, process.env.JWT_SECRET);

const solicitudMock = {
  id: 'sol-1',
  numeroExpediente: 'EXP-2026-123456',
  estado: 'APROBADA',
  fechaSolicitud: new Date().toISOString(),
  fechaResolucion: new Date().toISOString(),
  tipoTramite: { nombre: 'Licencia Comercial' },
  ciudadano:   { nombre: 'Juan Pérez', correo: 'juan@test.com', dpi: '1234567890101' },
  funcionario: { nombre: 'Op Uno' },
  historial:   [],
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/reportes/historial/:ciudadanoId', () => {
  test('200 — ciudadano ve su propio historial', async () => {
    prisma.solicitud.findMany.mockResolvedValue([solicitudMock]);

    const res = await request(app)
      .get('/api/reportes/historial/c-uuid')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('403 — ciudadano no puede ver historial ajeno', async () => {
    const res = await request(app)
      .get('/api/reportes/historial/otro-uuid')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(403);
  });

  test('200 — operador puede ver historial de cualquier ciudadano', async () => {
    prisma.solicitud.findMany.mockResolvedValue([solicitudMock]);

    const res = await request(app)
      .get('/api/reportes/historial/c-uuid')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(200);
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/reportes/historial/c-uuid');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/reportes/solicitudes', () => {
  test('200 — reporte con filtros', async () => {
    prisma.solicitud.findMany.mockResolvedValue([solicitudMock]);

    const res = await request(app)
      .get('/api/reportes/solicitudes?desde=2026-01-01&hasta=2026-12-31&estado=APROBADA')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('resumen');
    expect(res.body).toHaveProperty('solicitudes');
    expect(res.body.total).toBe(1);
  });

  test('200 — reporte sin filtros', async () => {
    prisma.solicitud.findMany.mockResolvedValue([solicitudMock]);

    const res = await request(app)
      .get('/api/reportes/solicitudes')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(200);
  });

  test('403 — ciudadano no puede ver reportes', async () => {
    const res = await request(app)
      .get('/api/reportes/solicitudes')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(403);
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/reportes/solicitudes');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/reportes/solicitudes/export', () => {
  test('200 — exporta CSV', async () => {
    prisma.solicitud.findMany.mockResolvedValue([solicitudMock]);

    const res = await request(app)
      .get('/api/reportes/solicitudes/export')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('Expediente');
    expect(res.text).toContain('EXP-2026-123456');
  });

  test('403 — ciudadano no puede exportar', async () => {
    const res = await request(app)
      .get('/api/reportes/solicitudes/export')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(403);
  });
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    tipoTramite: { findUnique: jest.fn() },
    solicitud: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    historialEstado: { create: jest.fn() },
    usuario: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function makeToken(id, rol) {
  return jwt.sign({ sub: id, rol }, process.env.JWT_SECRET);
}
const tokenCiudadano = (id = 'ciudadano-uuid') => makeToken(id, 'CIUDADANO');
const tokenOperador  = (id = 'operador-uuid')  => makeToken(id, 'OPERADOR');
const tokenSupervisor= (id = 'super-uuid')     => makeToken(id, 'SUPERVISOR');

const solicitudMock = {
  id: 'sol-uuid-1',
  numeroExpediente: 'EXP-2026-123456',
  ciudadanoId: 'ciudadano-uuid',
  tipoTramiteId: 1,
  estado: 'RECIBIDA',
  fechaSolicitud: new Date().toISOString(),
  tipoTramite: { id: 1, nombre: 'Licencia Comercial' },
  historial: [],
};

beforeEach(() => jest.clearAllMocks());

// ── POST /api/tramites ───────────────────────────────────────────────────────

describe('POST /api/tramites', () => {
  test('201 — crea solicitud con datos válidos (CIUDADANO)', async () => {
    prisma.tipoTramite.findUnique.mockResolvedValue({ id: 1, nombre: 'Licencia Comercial', activo: true });
    prisma.solicitud.create.mockResolvedValue(solicitudMock);
    prisma.historialEstado.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/tramites')
      .set('Authorization', `Bearer ${tokenCiudadano()}`)
      .send({ tipoTramiteId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.solicitud.numeroExpediente).toMatch(/^EXP-/);
    expect(res.body.solicitud.estado).toBe('RECIBIDA');
  });

  test('403 — OPERADOR no puede crear solicitud', async () => {
    const res = await request(app)
      .post('/api/tramites')
      .set('Authorization', `Bearer ${tokenOperador()}`)
      .send({ tipoTramiteId: 1 });

    expect(res.status).toBe(403);
  });

  test('401 — sin token', async () => {
    const res = await request(app).post('/api/tramites').send({ tipoTramiteId: 1 });
    expect(res.status).toBe(401);
  });

  test('400 — falta tipoTramiteId', async () => {
    const res = await request(app)
      .post('/api/tramites')
      .set('Authorization', `Bearer ${tokenCiudadano()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('404 — tipo de trámite inválido', async () => {
    prisma.tipoTramite.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/tramites')
      .set('Authorization', `Bearer ${tokenCiudadano()}`)
      .send({ tipoTramiteId: 999 });

    expect(res.status).toBe(404);
  });
});

// ── GET /api/tramites ────────────────────────────────────────────────────────

describe('GET /api/tramites', () => {
  test('200 — ciudadano ve sus propias solicitudes', async () => {
    prisma.solicitud.findMany.mockResolvedValue([solicitudMock]);

    const res = await request(app)
      .get('/api/tramites')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  test('200 — operador ve todas las solicitudes', async () => {
    prisma.solicitud.findMany.mockResolvedValue([solicitudMock]);

    const res = await request(app)
      .get('/api/tramites')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/tramites');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/tramites/:id ────────────────────────────────────────────────────

describe('GET /api/tramites/:id', () => {
  test('200 — ciudadano obtiene su propia solicitud', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(solicitudMock);

    const res = await request(app)
      .get('/api/tramites/sol-uuid-1')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(200);
    expect(res.body.numeroExpediente).toBe('EXP-2026-123456');
  });

  test('200 — operador obtiene cualquier solicitud', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(solicitudMock);

    const res = await request(app)
      .get('/api/tramites/sol-uuid-1')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(200);
  });

  test('404 — solicitud no existe', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/tramites/no-existe')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(404);
  });

  test('403 — ciudadano no puede ver solicitud ajena', async () => {
    prisma.solicitud.findUnique.mockResolvedValue({
      ...solicitudMock,
      ciudadanoId: 'otro-ciudadano-uuid',
    });

    const res = await request(app)
      .get('/api/tramites/sol-uuid-1')
      .set('Authorization', `Bearer ${tokenCiudadano('ciudadano-uuid')}`);

    expect(res.status).toBe(403);
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/tramites/sol-uuid-1');
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/tramites/:id/resolucion ──────────────────────────────────────

describe('PATCH /api/tramites/:id/resolucion', () => {
  test('200 — supervisor aprueba solicitud en revisión', async () => {
    const solicitudEnRevision = { ...solicitudMock, estado: 'EN_REVISION' };
    prisma.solicitud.findUnique.mockResolvedValue(solicitudEnRevision);
    prisma.usuario.findUnique.mockResolvedValue({ id: 'super-uuid', rol: 'SUPERVISOR' });
    prisma.$transaction.mockResolvedValue([
      { ...solicitudEnRevision, estado: 'APROBADA', tipoTramite: { nombre: 'Licencia Comercial' }, ciudadano: { nombre: 'Test', correo: 'test@test.com' } },
    ]);

    const res = await request(app)
      .patch('/api/tramites/sol-uuid-1/resolucion')
      .set('Authorization', `Bearer ${tokenSupervisor()}`)
      .send({ accion: 'APROBADA', comentario: 'Todo correcto' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Solicitud actualizada');
  });

  test('400 — acción no válida', async () => {
    const res = await request(app)
      .patch('/api/tramites/sol-uuid-1/resolucion')
      .set('Authorization', `Bearer ${tokenSupervisor()}`)
      .send({ accion: 'INVALIDA', comentario: 'test' });

    expect(res.status).toBe(400);
  });

  test('400 — comentario vacío', async () => {
    const res = await request(app)
      .patch('/api/tramites/sol-uuid-1/resolucion')
      .set('Authorization', `Bearer ${tokenSupervisor()}`)
      .send({ accion: 'APROBADA', comentario: '' });

    expect(res.status).toBe(400);
  });

  test('401 — sin token', async () => {
    const res = await request(app)
      .patch('/api/tramites/sol-uuid-1/resolucion')
      .send({ accion: 'APROBADA', comentario: 'test' });
    expect(res.status).toBe(401);
  });

  test('403 — ciudadano no puede resolver', async () => {
    const res = await request(app)
      .patch('/api/tramites/sol-uuid-1/resolucion')
      .set('Authorization', `Bearer ${tokenCiudadano()}`)
      .send({ accion: 'APROBADA', comentario: 'test' });
    expect(res.status).toBe(403);
  });
});

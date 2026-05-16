const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    inmueble: {
      findMany:  jest.fn(),
      findUnique: jest.fn(),
      create:    jest.fn(),
      update:    jest.fn(),
    },
    historialCatastro: { create: jest.fn() },
    usuario: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tokenOperador = () => jwt.sign({ sub: 'op-uuid', rol: 'OPERADOR' }, process.env.JWT_SECRET);
const tokenCiudadano = () => jwt.sign({ sub: 'c-uuid', rol: 'CIUDADANO' }, process.env.JWT_SECRET);

const inmuebleMock = {
  id: 1,
  numeroCatastral: 'CAT-001',
  direccion: '1ra Calle 2-34 Zona 1',
  propietario: 'Juan Pérez',
  area: 120.50,
  valorCatastral: 250000.00,
  activo: true,
  historial: [],
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/catastro', () => {
  test('200 — lista inmuebles (operador)', async () => {
    prisma.inmueble.findMany.mockResolvedValue([inmuebleMock]);

    const res = await request(app)
      .get('/api/catastro')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  test('403 — ciudadano no puede acceder', async () => {
    const res = await request(app)
      .get('/api/catastro')
      .set('Authorization', `Bearer ${tokenCiudadano()}`);

    expect(res.status).toBe(403);
  });

  test('401 — sin token', async () => {
    const res = await request(app).get('/api/catastro');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/catastro/:id', () => {
  test('200 — obtiene inmueble con historial', async () => {
    prisma.inmueble.findUnique.mockResolvedValue(inmuebleMock);

    const res = await request(app)
      .get('/api/catastro/1')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(200);
    expect(res.body.numeroCatastral).toBe('CAT-001');
  });

  test('404 — inmueble no existe', async () => {
    prisma.inmueble.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/catastro/999')
      .set('Authorization', `Bearer ${tokenOperador()}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/catastro', () => {
  test('201 — crea inmueble correctamente', async () => {
    prisma.inmueble.findUnique.mockResolvedValue(null);
    prisma.inmueble.create.mockResolvedValue(inmuebleMock);

    const res = await request(app)
      .post('/api/catastro')
      .set('Authorization', `Bearer ${tokenOperador()}`)
      .send({
        numeroCatastral: 'CAT-001',
        direccion: '1ra Calle 2-34 Zona 1',
        propietario: 'Juan Pérez',
        area: 120.50,
        valorCatastral: 250000.00,
      });

    expect(res.status).toBe(201);
    expect(res.body.inmueble.numeroCatastral).toBe('CAT-001');
  });

  test('400 — faltan campos requeridos', async () => {
    const res = await request(app)
      .post('/api/catastro')
      .set('Authorization', `Bearer ${tokenOperador()}`)
      .send({ numeroCatastral: 'CAT-001' });

    expect(res.status).toBe(400);
  });

  test('409 — número catastral duplicado', async () => {
    prisma.inmueble.findUnique.mockResolvedValue(inmuebleMock);

    const res = await request(app)
      .post('/api/catastro')
      .set('Authorization', `Bearer ${tokenOperador()}`)
      .send({
        numeroCatastral: 'CAT-001',
        direccion: '1ra Calle',
        propietario: 'Juan',
        area: 100,
        valorCatastral: 100000,
      });

    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/catastro/:id/propietario', () => {
  test('200 — actualiza propietario', async () => {
    prisma.inmueble.findUnique.mockResolvedValue(inmuebleMock);
    prisma.$transaction.mockResolvedValue([
      { ...inmuebleMock, propietario: 'María López' },
    ]);

    const res = await request(app)
      .patch('/api/catastro/1/propietario')
      .set('Authorization', `Bearer ${tokenOperador()}`)
      .send({ propietarioNuevo: 'María López', motivo: 'Compraventa' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Propietario actualizado');
  });

  test('400 — propietario vacío', async () => {
    const res = await request(app)
      .patch('/api/catastro/1/propietario')
      .set('Authorization', `Bearer ${tokenOperador()}`)
      .send({ propietarioNuevo: '' });

    expect(res.status).toBe(400);
  });

  test('404 — inmueble no existe', async () => {
    prisma.inmueble.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/catastro/999/propietario')
      .set('Authorization', `Bearer ${tokenOperador()}`)
      .send({ propietarioNuevo: 'Nuevo Dueño' });

    expect(res.status).toBe(404);
  });
});

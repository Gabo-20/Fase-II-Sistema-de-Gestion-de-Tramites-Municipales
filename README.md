# Sistema de Gestión de Trámites Municipales

> Plataforma web para la digitalización y gestión de trámites municipales en Guatemala — licencias comerciales, permisos de construcción y registro catastral.

[![CI](https://github.com/Gabo-20/Fase-II-Sistema-de-Gestion-de-Tramites-Municipales/actions/workflows/ci.yml/badge.svg)](https://github.com/Gabo-20/Fase-II-Sistema-de-Gestion-de-Tramites-Municipales/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

**Demo en producción:** https://tramites-municipales.duckdns.org/login

---

## Tabla de Contenido

- [Descripción](#descripción)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración Local](#instalación-y-configuración-local)
- [Variables de Entorno](#variables-de-entorno)
- [API — Endpoints Disponibles](#api--endpoints-disponibles)
- [Pruebas](#pruebas)
- [Pipeline CI/CD](#pipeline-cicd)
- [Despliegue en Producción](#despliegue-en-producción)
- [Equipo](#equipo)

---

## Descripción

El Sistema de Gestión de Trámites Municipales es una aplicación web full-stack que permite a los ciudadanos iniciar y dar seguimiento a sus trámites municipales de forma digital, eliminando la necesidad de asistir presencialmente a las oficinas. Los operadores y supervisores municipales gestionan, revisan y resuelven las solicitudes desde un panel centralizado.

El sistema contempla tres módulos principales:

- **Trámites:** Creación y seguimiento de solicitudes de licencias comerciales, permisos de construcción y otros trámites.
- **Catastro:** Registro y gestión de inmuebles municipales con historial de cambios de propietario.
- **Reportes y Dashboard:** Estadísticas en tiempo real para el personal municipal.

---

## Características

### Para ciudadanos
- Registro e inicio de sesión con autenticación JWT
- Creación de solicitudes de trámite por tipo
- Seguimiento del estado de cada expediente (RECIBIDA → EN_REVISION → APROBADA / RECHAZADA)
- Historial completo de cambios de estado con comentarios
- Notificaciones por correo electrónico en cada cambio de estado

### Para operadores
- Visualización de todas las solicitudes activas
- Gestión del registro catastral (alta, consulta, cambio de propietario)
- Acceso restringido por rol

### Para supervisores y administradores
- Aprobación o rechazo de solicitudes con comentario obligatorio
- Dashboard con estadísticas: total de solicitudes, usuarios activos, distribución por estado y tipo
- Generación de reportes exportables
- Gestión de usuarios del sistema

---

## Arquitectura

El sistema sigue una arquitectura cliente-servidor clásica de tres capas, desplegada en contenedores Docker sobre un VPS:

```
┌─────────────────────────────────────────────────────┐
│                     CLIENTE                         │
│          React 19 + Vite + Tailwind CSS             │
│              (servido por Nginx)                    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / REST JSON
┌──────────────────────▼──────────────────────────────┐
│                   BACKEND / API                     │
│           Node.js + Express + Prisma ORM            │
│     JWT Auth │ Nodemailer │ Validación de roles      │
└──────────────────────┬──────────────────────────────┘
                       │ TCP 3306
┌──────────────────────▼──────────────────────────────┐
│               BASE DE DATOS                         │
│                  MariaDB 10.11                      │
│         (volumen persistente en Docker)             │
└─────────────────────────────────────────────────────┘
```

**Estrategia de branching:** GitHub Flow — rama `main` para producción, `develop` como rama de integración, ramas de feature por sprint (`sprint-N-descripcion`).

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | 19 / 6 / 4 |
| Backend | Node.js + Express | 20 LTS / 4.x |
| ORM | Prisma | 5.x |
| Base de datos | MariaDB | 10.11 |
| Autenticación | JWT + bcryptjs | — |
| Correos | Nodemailer + Gmail SMTP | — |
| Contenedores | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |
| Hosting | VPS (Ubuntu) | — |
| Testing | Jest + Supertest | 29.x / 7.x |
| Cobertura | Istanbul (integrado en Jest) | — |

---

## Estructura del Repositorio

```
tramites-municipales/
│
├── backend/                        # API REST
│   ├── src/
│   │   ├── app.js                  # Configuración Express y rutas
│   │   ├── server.js               # Entry point del servidor
│   │   ├── controllers/            # Lógica de controladores
│   │   ├── routes/                 # Definición de rutas por módulo
│   │   │   ├── auth.js
│   │   │   ├── tramites.js
│   │   │   ├── tiposTramite.js
│   │   │   ├── catastro.js
│   │   │   ├── dashboard.js
│   │   │   ├── reportes.js
│   │   │   ├── notificaciones.js
│   │   │   └── usuarios.js
│   │   ├── middlewares/
│   │   │   └── auth.js             # Middleware de autenticación JWT y roles
│   │   └── services/               # Lógica de negocio desacoplada
│   ├── tests/                      # Suite de pruebas unitarias (Jest + Supertest)
│   │   ├── setup.js
│   │   ├── auth.test.js
│   │   ├── tramites.test.js
│   │   ├── catastro.test.js
│   │   ├── dashboard.test.js
│   │   ├── reportes.test.js
│   │   ├── notificaciones.test.js
│   │   ├── tipos-tramite.test.js
│   │   └── health.test.js
│   ├── prisma/
│   │   └── schema.prisma           # Modelo de datos
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                       # SPA React
│   ├── src/
│   │   ├── components/             # Componentes reutilizables
│   │   ├── context/                # AuthContext (estado global de sesión)
│   │   └── assets/
│   ├── nginx.conf                  # Configuración Nginx para producción
│   ├── Dockerfile
│   └── vite.config.js
│
├── .github/
│   └── workflows/
│       └── ci.yml                  # Pipeline CI: lint + test + build
│
├── docker-compose.yml              # Producción
├── docker-compose.dev.yml          # Desarrollo local
├── .env.example                    # Variables de entorno raíz (producción)
└── vps-setup.sh                    # Script de configuración inicial del VPS
```

---

## Requisitos Previos

Para correr el proyecto localmente se necesita:

- [Docker](https://www.docker.com/get-started) y Docker Compose (recomendado)
- **O** Node.js 20+ y MariaDB 10.11+ instalados manualmente

---

## Instalación y Configuración Local

### Opción A — Docker (recomendada)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Gabo-20/Fase-II-Sistema-de-Gestion-de-Tramites-Municipales.git
cd Fase-II-Sistema-de-Gestion-de-Tramites-Municipales/tramites-municipales

# 2. Crear archivos de entorno
cp .env.example .env
cp backend/.env.example backend/.env
# Editar ambos archivos con los valores correspondientes

# 3. Levantar todos los servicios
docker compose -f docker-compose.dev.yml up --build

# 4. Correr migraciones (solo la primera vez)
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev
```

Servicios disponibles tras el inicio:

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API REST | http://localhost:3000 |
| Health check | http://localhost:3000/health |
| phpMyAdmin | http://localhost:8080 |

---

### Opción B — Sin Docker (desarrollo manual)

```bash
# --- Backend ---
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev        # Inicia en http://localhost:3000

# --- Frontend (en otra terminal) ---
cd frontend
npm install
npm run dev        # Inicia en http://localhost:5173
```

---

## Variables de Entorno

### `backend/.env`

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor Express | `3000` |
| `DATABASE_URL` | Cadena de conexión MariaDB | `mysql://user:pass@localhost:3306/tramites_municipales` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | Cadena aleatoria larga |
| `JWT_EXPIRES_IN` | Duración del token de acceso | `30m` |
| `GMAIL_USER` | Correo para envío de notificaciones | `tucorreo@gmail.com` |
| `GMAIL_APP_PASSWORD` | Contraseña de aplicación de Gmail | `xxxx xxxx xxxx xxxx` |

### `.env` (raíz — producción Docker)

| Variable | Descripción |
|---|---|
| `DB_ROOT_PASSWORD` | Contraseña root de MariaDB |
| `DB_PASSWORD` | Contraseña del usuario de aplicación |

> Nunca subas archivos `.env` reales al repositorio. Están incluidos en `.gitignore`.

---

## API — Endpoints Disponibles

Base URL: `http://localhost:3000/api`

### Autenticación

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/auth/registro` | Registrar nuevo ciudadano | Público |
| `POST` | `/auth/login` | Iniciar sesión, retorna JWT | Público |
| `GET` | `/auth/me` | Perfil del usuario autenticado | Autenticado |

### Trámites

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `GET` | `/tramites` | Listar solicitudes (propias o todas) | Autenticado |
| `POST` | `/tramites` | Crear nueva solicitud | CIUDADANO |
| `GET` | `/tramites/:id` | Detalle de una solicitud | Autenticado |
| `PATCH` | `/tramites/:id/resolucion` | Aprobar o rechazar solicitud | SUPERVISOR |

### Catastro

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `GET` | `/catastro` | Listar inmuebles | OPERADOR+ |
| `GET` | `/catastro/:id` | Detalle de inmueble con historial | OPERADOR+ |
| `POST` | `/catastro` | Registrar nuevo inmueble | OPERADOR+ |
| `PATCH` | `/catastro/:id/propietario` | Cambiar propietario | OPERADOR+ |

### Otros módulos

| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| `GET` | `/dashboard/stats` | Estadísticas globales del sistema | ADMIN |
| `GET` | `/tipos-tramite` | Catálogo de tipos de trámite | Autenticado |
| `GET` | `/reportes` | Reportes exportables | SUPERVISOR+ |
| `GET` | `/notificaciones` | Notificaciones del usuario | Autenticado |
| `GET` | `/health` | Health check del servidor | Público |

**Roles disponibles:** `CIUDADANO` · `OPERADOR` · `SUPERVISOR` · `ADMIN`

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <token>
```

---

## Pruebas

El proyecto cuenta con una suite de pruebas unitarias sobre el backend usando **Jest** y **Supertest**.

```bash
cd backend

# Correr todos los tests con reporte de cobertura
npm test
```

### Resultado actual

```
Test Suites: 8 passed, 8 total
Tests:       57 passed, 57 total
Coverage:    69.04% de líneas (umbral mínimo: 60%)
```

### Módulos cubiertos

| Archivo de prueba | Casos | Qué valida |
|---|---|---|
| `auth.test.js` | 10 | Registro, login, validación de token |
| `tramites.test.js` | 18 | CRUD de solicitudes, control de acceso por rol |
| `catastro.test.js` | 11 | Gestión de inmuebles y cambio de propietario |
| `dashboard.test.js` | 3 | Estadísticas y restricción de acceso |
| `reportes.test.js` | 5 | Generación de reportes |
| `notificaciones.test.js` | 4 | Consulta de notificaciones |
| `tipos-tramite.test.js` | 4 | Catálogo de tipos |
| `health.test.js` | 2 | Health check del servidor |

El reporte de cobertura HTML se genera en `backend/coverage/` y se publica como artifact en cada ejecución del pipeline.

---

## Pipeline CI/CD

El pipeline está implementado con **GitHub Actions** y se ejecuta en cada push y en cada Pull Request hacia `develop` o `main`.

**Archivo:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

### Etapas

```
Push / PR
    │
    ├── Job: Backend (ubuntu-latest, Node 20)
    │   ├── Checkout del código
    │   ├── Instalar dependencias (npm ci)
    │   ├── Generar cliente Prisma
    │   ├── Lint (ESLint)
    │   ├── Tests + cobertura (Jest --coverage)
    │   └── Publicar reporte de cobertura como artifact
    │
    └── Job: Frontend (ubuntu-latest, Node 20)
        ├── Checkout del código
        ├── Instalar dependencias (npm ci)
        └── Build de producción (Vite)
```

El despliegue a producción se realiza manualmente mediante `docker compose` en el VPS una vez que los jobs del pipeline están en verde.

---

## Despliegue en Producción

El sistema está desplegado en un VPS Ubuntu con Docker. El dominio `tramites-municipales.duckdns.org` apunta al VPS con HTTPS gestionado por el servidor.

```bash
# En el VPS, desde el directorio del proyecto:

# Primera vez — configuración inicial
chmod +x vps-setup.sh && ./vps-setup.sh

# Actualizar a la última versión de main
git pull origin main
docker compose up --build -d

# Correr migraciones pendientes
docker compose exec backend npx prisma migrate deploy
```

**Servicios en producción:**

| Servicio | Puerto interno |
|---|---|
| Frontend (Nginx) | 80 |
| API REST | 3000 |
| MariaDB | 3306 |
| phpMyAdmin | 8080 |

---

## Equipo

| Nombre | Carné | Rol principal |
|---|---|---|
| Gabriel Enrique Perez Meza | 0900-23-14509 | Backend, DevOps, CI/CD |
| Bryan Martínez | 0900-22-9115 | Frontend, UI/UX |

**Curso:** Ingeniería de Software — 9.º Semestre
**Universidad:** Mariano Gálvez de Guatemala

# Snap

Acortador de URLs con autenticación, analíticas de clicks y una interfaz web mínima. Backend en Node/TypeScript/Express con SQLite; frontend estático (HTML/CSS/JS plano) servido por el mismo servidor.

## Stack

- **Runtime**: Node.js + TypeScript (ESM), ejecutado en dev con [`tsx`](https://github.com/privatenumber/tsx)
- **Framework web**: Express 4
- **Base de datos**: SQLite vía [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) (sin ORM, SQL directo)
- **Auth**: JWT (`jsonwebtoken`) + hashing de passwords con `bcryptjs`
- **Tests**: `vitest` + `supertest`
- **Frontend**: HTML/CSS/JS estático en `public/`, sin build step ni dependencias adicionales — Express lo sirve directamente

## Requisitos

- Node.js 20+ (recomendado)
- npm

## Instalación

```bash
npm install
```

## Configuración

Variables de entorno (todas opcionales en desarrollo, con valores por defecto):

| Variable | Descripción | Default (dev) |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | `development` o `production` | `development` |
| `DB_NAME` | Ruta del archivo SQLite | `snap.db` |
| `JWT_SECRET` | Secreto para firmar los JWT | `dev-secret-please-change` |

> En `NODE_ENV=production`, `DB_NAME` y `JWT_SECRET` son obligatorios (el arranque falla si faltan). Ver [`src/config.ts`](src/config.ts).

## Cómo correr el proyecto

Backend y frontend se sirven **juntos, desde el mismo proceso** — no hay un servidor de frontend separado ni build de assets.

### Desarrollo

```bash
npm run dev
```

Levanta el servidor con recarga automática (`tsx watch`) en `http://localhost:3000`. Abre esa URL en el navegador: redirige a `/login.html` si no hay sesión.

### Producción

```bash
npm run build   # compila TypeScript a dist/
npm start       # node dist/index.js
```

### Tests

```bash
npm test          # corre toda la suite una vez (vitest run)
npm run test:watch  # modo watch
```

Los tests usan una base de datos SQLite en memoria (activado automáticamente cuando `vitest` define `process.env.VITEST`), así que no tocan `snap.db`.

## Estructura del proyecto

```
src/
  app.ts              # ensamblaje de la app Express (middlewares + routers)
  index.ts             # punto de entrada, arranca el servidor
  config.ts            # carga de variables de entorno
  db/connection.ts     # conexión SQLite + esquema (users, urls, clicks)
  auth/                # registro, login, JWT
  urls/                # crear/listar/borrar URLs cortas, redirección
  clicks/              # registro de clicks y queries de agregación
  dashboard/            # endpoint de estadísticas del usuario
  middleware/           # requireAuth, requestLogger, notFound, errorHandler
public/                # frontend estático servido por Express (sin build)
  index.html            # redirige a /login.html o /app.html según sesión
  login.html / register.html
  app.html              # dashboard: stats, tendencia, crear URL, listado
  css/style.css
  js/                    # api.js (fetch + sesión), login.js, register.js, app.js
tests/                  # vitest + supertest, uno por módulo
docs/API.md             # referencia completa de los endpoints
```

## Documentación de la API

Ver [`docs/API.md`](docs/API.md) para el detalle de cada endpoint (auth, urls, dashboard), formatos de request/response y códigos de error.

## Flujo de uso rápido

1. `npm run dev` y abrir `http://localhost:3000`.
2. Registrarse (`/register.html`) o iniciar sesión (`/login.html`).
3. En el dashboard (`/app.html`): crear una URL corta, verla aparecer en el listado al instante, y visitar el enlace corto (`http://localhost:3000/<código>`) para generar clicks y ver las estadísticas actualizarse.

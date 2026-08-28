# API de Snap

Todas las respuestas son JSON salvo la redirección (`GET /:code`). Los endpoints marcados como protegidos requieren el header `Authorization: Bearer <token>` obtenido en `/auth/register` o `/auth/login`.

## Salud

### `GET /health`
Respuesta `200`:
```json
{ "status": "ok" }
```

## Autenticación

### `POST /auth/register`
Body:
```json
{ "email": "persona@example.com", "password": "clave-segura-123", "name": "Persona" }
```
- `400` si el email es inválido, el password tiene menos de 8 caracteres, o falta el nombre.
- `409` si el email ya está registrado.
- `201`:
```json
{
  "user": { "id": 1, "email": "persona@example.com", "name": "Persona", "createdAt": "..." },
  "token": "<jwt>"
}
```

### `POST /auth/login`
Body: `{ "email": "...", "password": "..." }`
- `400` si falta email/password o el email es inválido.
- `401` si las credenciales son incorrectas.
- `200`: mismo formato que el registro (`user` + `token`).

## URLs

### `POST /urls` (protegido)
Body: `{ "url": "https://ejemplo.com/pagina" }`
- `400` si `url` falta o no es una URL válida.
- `401` sin token.
- `201`: la URL creada (`id`, `code`, `originalUrl`, `userId`, `createdAt`).

### `GET /urls`
Lista todas las URLs registradas (de todos los usuarios), sin autenticación. `200` con un array (vacío si no hay URLs).

### `DELETE /urls/:code` (protegido)
- `401` sin token.
- `403` si el usuario autenticado no es el dueño de la URL.
- `404` si el código no existe.
- `204` si se borra correctamente.

### `GET /:code`
Redirige (`302`) a la URL original asociada al código, y registra un click (ver [Dashboard](#dashboard)). `404` si el código no existe.

## Dashboard

### `GET /dashboard` (protegido)
Devuelve un resumen del rendimiento de las URLs del usuario autenticado: totales de clicks y una tendencia diaria de los últimos 30 días.

- `401` sin token.
- `200`:
```json
{
  "totals": {
    "accountClicks": 42,
    "urls": [
      { "code": "abc123", "originalUrl": "https://example.com", "totalClicks": 30 },
      { "code": "xyz789", "originalUrl": "https://otra.com", "totalClicks": 12 }
    ]
  },
  "trend": {
    "rangeDays": 30,
    "points": [
      { "date": "2026-07-29", "clicks": 0 },
      { "date": "2026-07-30", "clicks": 3 }
    ]
  }
}
```

Notas:
- `totals.urls` incluye únicamente las URLs del usuario autenticado, ordenadas de la más reciente a la más antigua, con su conteo total de clicks (histórico completo).
- `trend.points` cubre siempre los últimos `rangeDays` días (por defecto 30), incluyendo los días sin clicks con `clicks: 0`; los clicks anteriores a esa ventana no aparecen en la tendencia pero sí se cuentan en `totals`.
- Cada click se registra automáticamente al resolverse una redirección en `GET /:code`.
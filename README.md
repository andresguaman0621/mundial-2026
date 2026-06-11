# Polla Mundial 2026 ⚽

App de "polla" (quiniela) del Mundial 2026. Los datos del torneo se traen en vivo desde
[wcup2026.org](https://wcup2026.org) y los participantes se guardan de forma persistente en
**Turso** (libSQL). Frontend en **Vue 3 + Vite**, backend en **Vercel Serverless Functions**.

## Arquitectura

- `src/` — app Vue 3 (SPA). La lógica de dominio (conversión de la API, eliminación,
  clasificados, i18n) vive en `src/lib/tournament.js`.
- `api/` — funciones serverless de Vercel que hablan con Turso. El auth token de Turso vive
  **solo** en variables de entorno del servidor; nunca se expone al navegador.
  - `GET  /api/participants` — lista participantes.
  - `POST /api/participants` — alta (requiere header `x-admin-key`).
  - `DELETE /api/participants?id=...` — baja (requiere header `x-admin-key`).
  - `POST /api/login` — valida la password de admin contra `ADMIN_PASSWORD`.

Los datos del torneo siguen trayéndose en vivo del navegador (con caché en `localStorage`
como respaldo offline). Solo los participantes se persisten en Turso.

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```
TURSO_DATABASE_URL=libsql://tu-base.turso.io
TURSO_AUTH_TOKEN=...
ADMIN_PASSWORD=mundial2026
```

La tabla `participants` se crea sola (idempotente) en la primera petición a `/api`.

## Desarrollo local

```bash
npm install
npm i -g vercel        # si no lo tienes
vercel dev             # levanta frontend (Vite) + funciones /api juntos
```

> Usa `vercel dev`, no `npm run dev` a secas: `vite` solo no levanta las funciones de `/api`,
> así que la persistencia con Turso no funcionaría. `npm run dev` sirve para iterar la UI sin DB.

## Deploy en Vercel

1. Sube el repo a GitHub.
2. En Vercel, **Import Project** → selecciona el repo (detecta Vite automáticamente).
3. En **Settings → Environment Variables** carga las 3 variables (`TURSO_DATABASE_URL`,
   `TURSO_AUTH_TOKEN`, `ADMIN_PASSWORD`).
4. Deploy. La carpeta `api/` se publica como funciones serverless automáticamente.

## Admin

Botón **⚙️ Admin** (arriba a la derecha). Ingresa con la password de `ADMIN_PASSWORD`
(el campo "Usuario" es decorativo). Desde el panel puedes agregar/eliminar participantes;
esos cambios se guardan en Turso y se comparten entre todos los dispositivos.

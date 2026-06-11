-- ════════════════════════════════════════════════════════════
-- Polla Mundial 2026 · Alta del usuario admin (Turso / libSQL)
-- Ejecuta este archivo DESPUÉS de 01_schema.sql.
--
--   turso db shell <nombre-db> < commands/02_seed_admin.sql
--
-- El valor de password_hash es SHA-256(hex) de la contraseña que tienes
-- en .env (ADMIN_PASSWORD). El texto plano NO se guarda aquí.
--
-- Password actual en .env: Mundial2026*
-- SHA-256:                 26c70f500bb6cb2f5535a7e337c7a1ba10c1c8966a2aee2cee33d64bf7f6995c
--
-- Si cambias ADMIN_PASSWORD, recalcula el hash con:
--   node --env-file=.env -e "console.log(require('crypto').createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex'))"
-- y reemplázalo abajo.
-- ════════════════════════════════════════════════════════════

INSERT INTO admins (username, password_hash, created_at)
VALUES (
  'admin',
  '26c70f500bb6cb2f5535a7e337c7a1ba10c1c8966a2aee2cee33d64bf7f6995c',
  unixepoch() * 1000
)
ON CONFLICT(username) DO UPDATE SET
  password_hash = excluded.password_hash;

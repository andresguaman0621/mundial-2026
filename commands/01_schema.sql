-- ════════════════════════════════════════════════════════════
-- Polla Mundial 2026 · Esquema de base de datos (Turso / libSQL)
-- Ejecuta este archivo UNA vez en tu base de datos Turso.
--
--   turso db shell <nombre-db> < commands/01_schema.sql
--
-- (o pega el contenido en la consola web de Turso)
-- Todas las sentencias son idempotentes (IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════

-- Participantes de la polla (apuestas).
CREATE TABLE IF NOT EXISTS participants (
  id         TEXT    PRIMARY KEY,
  name       TEXT    NOT NULL,
  team_id    TEXT    NOT NULL,
  team_name  TEXT    NOT NULL,
  points     INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Usuarios administradores. La password NUNCA se guarda en texto plano:
-- se almacena su hash SHA-256 (hex). El login del servidor compara el hash
-- de la password ingresada contra password_hash.
CREATE TABLE IF NOT EXISTS admins (
  username      TEXT    PRIMARY KEY,
  password_hash TEXT    NOT NULL,
  created_at    INTEGER NOT NULL
);

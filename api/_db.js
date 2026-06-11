import { createClient } from '@libsql/client';
import { createHash } from 'node:crypto';

let client;
let ready;

// Cliente Turso compartido entre invocaciones (reutiliza la conexión en caliente).
// Las tablas se crean de forma perezosa la primera vez (idempotente), por si la
// base aún no fue inicializada con commands/01_schema.sql.
export function getDb() {
  client ??= createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  ready ??= client.batch([
    `CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      team_id TEXT NOT NULL,
      team_name TEXT NOT NULL,
      points INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admins (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`
  ], 'write');
  return ready.then(() => client);
}

export function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

// Lee el body JSON de una request de Vercel Node (req.body puede venir ya parseado
// o como string/stream según el runtime).
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

// Valida una password contra la tabla `admins` (comparando hashes SHA-256).
// Si no hay coincidencia, cae al fallback de ADMIN_PASSWORD del entorno, de modo
// que el login funciona aunque todavía no se haya ejecutado commands/02_seed_admin.sql.
export async function verifyAdminPassword(password) {
  if (!password) return false;
  if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) return true;
  try {
    const db = await getDb();
    const { rows } = await db.execute({
      sql: 'SELECT 1 FROM admins WHERE password_hash = ? LIMIT 1',
      args: [sha256(password)]
    });
    return rows.length > 0;
  } catch (e) {
    console.error('verifyAdminPassword', e);
    return false;
  }
}

// La clave de admin viaja en el header x-admin-key (la password en claro).
export function isAdmin(req) {
  return verifyAdminPassword(req.headers['x-admin-key']);
}

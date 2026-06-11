import { createClient } from '@libsql/client';
import { createHash } from 'node:crypto';

const sha256 = (v) => createHash('sha256').update(String(v)).digest('hex');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Aplica el esquema (idempotente), igual que commands/01_schema.sql.
await client.batch([
  `CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, team_id TEXT NOT NULL,
    team_name TEXT NOT NULL, points INTEGER NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS admins (
    username TEXT PRIMARY KEY, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL)`
], 'write');

// Siembra el admin desde ADMIN_PASSWORD (igual que commands/02_seed_admin.sql).
await client.execute({
  sql: `INSERT INTO admins (username, password_hash, created_at)
        VALUES ('admin', ?, ?)
        ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`,
  args: [sha256(process.env.ADMIN_PASSWORD), Date.now()]
});

const p = await client.execute('SELECT COUNT(*) AS n FROM participants');
const a = await client.execute('SELECT username, password_hash FROM admins');
console.log('✅ Conexión OK.');
console.log('   participants:', Number(p.rows[0].n));
console.log('   admins:', a.rows.map(r => r.username).join(', '));

// Verifica el login: password correcta vs incorrecta.
const stored = a.rows.find(r => r.username === 'admin')?.password_hash;
console.log('   login con password correcta:', sha256(process.env.ADMIN_PASSWORD) === stored ? 'OK ✅' : 'FALLA ❌');
console.log('   login con password incorrecta:', sha256('claveMala') === stored ? 'aceptada ❌' : 'rechazada ✅');

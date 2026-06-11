import { getDb, readJson, isAdmin } from './_db.js';

function rowToParticipant(r) {
  return {
    id: r.id,
    name: r.name,
    teamId: r.team_id,
    teamName: r.team_name,
    points: Number(r.points),
    createdAt: Number(r.created_at)
  };
}

export default async function handler(req, res) {
  try {
    const db = await getDb();

    if (req.method === 'GET') {
      const { rows } = await db.execute('SELECT * FROM participants ORDER BY created_at');
      return res.status(200).json({ ok: true, participants: rows.map(rowToParticipant) });
    }

    if (req.method === 'POST') {
      if (!(await isAdmin(req))) return res.status(401).json({ ok: false, error: 'No autorizado' });
      const body = await readJson(req);
      const name = String(body.name || '').trim();
      const teamId = String(body.teamId || '').trim();
      const teamName = String(body.teamName || '').trim();
      const points = parseInt(body.points, 10);

      if (!name) return res.status(400).json({ ok: false, error: 'Ingresa un nombre' });
      if (!teamId) return res.status(400).json({ ok: false, error: 'Selecciona una selección' });
      if (!Number.isFinite(points) || points < 1)
        return res.status(400).json({ ok: false, error: 'Los puntos deben ser al menos 1' });

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const createdAt = Date.now();
      await db.execute({
        sql: `INSERT INTO participants (id, name, team_id, team_name, points, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [id, name, teamId, teamName, points, createdAt]
      });
      return res.status(201).json({
        ok: true,
        participant: { id, name, teamId, teamName, points, createdAt }
      });
    }

    if (req.method === 'DELETE') {
      if (!(await isAdmin(req))) return res.status(401).json({ ok: false, error: 'No autorizado' });
      const id = req.query?.id || new URL(req.url, 'http://x').searchParams.get('id');
      if (!id) return res.status(400).json({ ok: false, error: 'Falta el id' });
      await db.execute({ sql: 'DELETE FROM participants WHERE id = ?', args: [String(id)] });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  } catch (e) {
    console.error('participants error', e);
    return res.status(500).json({ ok: false, error: e.message || 'Error interno' });
  }
}

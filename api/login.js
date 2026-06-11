import { readJson, verifyAdminPassword } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }
  try {
    const body = await readJson(req);
    const password = String(body.password || '');
    const ok = await verifyAdminPassword(password);
    return res.status(ok ? 200 : 401).json({ ok });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ ok: false, error: e.message || 'Error interno' });
  }
}

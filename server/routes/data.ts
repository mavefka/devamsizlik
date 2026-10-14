import { Router, type Response } from 'express';
import { db } from '../db';
import { authMiddleware, type AuthenticatedRequest } from '../auth';

const router = Router();

// Get user data
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const row = db.prepare('SELECT data_json, updated_at FROM user_data WHERE user_id = ?').get(req.user!.id) as any;

    if (!row) {
      res.json({ data: null });
      return;
    }

    const parsed = JSON.parse(row.data_json);
    res.json({ data: parsed, updatedAt: row.updated_at });
  } catch (err) {
    console.error('Get data error:', err);
    res.status(500).json({ error: 'Veriler alınamadı' });
  }
});

// Save / sync user data
router.put('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== 'object') {
      res.status(400).json({ error: 'Geçersiz veri biçimi' });
      return;
    }

    const dataJson = JSON.stringify(data);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO user_data (user_id, data_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        data_json = excluded.data_json,
        updated_at = excluded.updated_at
    `).run(req.user!.id, dataJson, now);

    res.json({ ok: true, updatedAt: now });
  } catch (err) {
    console.error('Save data error:', err);
    res.status(500).json({ error: 'Veriler kaydedilemedi' });
  }
});

export default router;

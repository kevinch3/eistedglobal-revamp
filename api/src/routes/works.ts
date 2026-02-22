import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { Work } from '../types';

const router = Router();
router.use(requireAuth);

// GET /api/works?comp=CH202401&participant=5
router.get('/', (req: Request, res: Response) => {
  const { comp, participant } = req.query as { comp?: string; participant?: string };
  let sql = `
    SELECT w.*, p.name, p.surname, p.type
    FROM work w
    JOIN participant p ON w.participant_id = p.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (comp) { sql += ' AND w.competition_id = ?'; params.push(comp); }
  if (participant) { sql += ' AND w.participant_id = ?'; params.push(participant); }
  sql += ' ORDER BY w.placement ASC, w.title ASC';

  res.json(getDb().prepare(sql).all(...params));
});

// GET /api/works/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = getDb()
    .prepare(
      `SELECT w.*, p.name, p.surname FROM work w
       JOIN participant p ON w.participant_id = p.id
       WHERE w.id = ?`
    )
    .get(req.params.id);
  if (!row) { res.status(404).json({ error: 'Work not found' }); return; }
  res.json(row);
});

// POST /api/works
router.post('/', (req: Request, res: Response) => {
  const w = req.body as Work;
  if (!w.participant_id || !w.competition_id || !w.title) {
    res.status(400).json({ error: 'participant_id, competition_id, and title are required' });
    return;
  }
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO work (participant_id, display_name, placement, competition_id, title, video_url, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      w.participant_id, w.display_name ?? null, w.placement ?? null,
      w.competition_id, w.title, w.video_url ?? null, w.photo_url ?? null
    );
  res.status(201).json(db.prepare('SELECT * FROM work WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/works/:id
router.put('/:id', (req: Request, res: Response) => {
  const w = req.body as Work;
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE work SET display_name=?, placement=?, title=?, video_url=?, photo_url=?
       WHERE id=?`
    )
    .run(
      w.display_name ?? null, w.placement ?? null, w.title,
      w.video_url ?? null, w.photo_url ?? null, req.params.id
    );
  if (result.changes === 0) { res.status(404).json({ error: 'Work not found' }); return; }
  res.json(db.prepare('SELECT * FROM work WHERE id = ?').get(req.params.id));
});

// DELETE /api/works/:id
router.delete('/:id', (req: Request, res: Response) => {
  const result = getDb().prepare('DELETE FROM work WHERE id = ?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Work not found' }); return; }
  res.status(204).send();
});

export default router;

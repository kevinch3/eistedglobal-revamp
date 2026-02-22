import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { Competition } from '../types';

const router = Router();
router.use(requireAuth);

// GET /api/competitions?year=2024&type=IND
router.get('/', (req: Request, res: Response) => {
  const { year, type } = req.query as { year?: string; type?: string };
  let sql = `
    SELECT c.*, cat.name AS category_name, cat.name_welsh AS category_name_welsh
    FROM competition c
    JOIN category cat ON c.category_id = cat.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (year) {
    sql += ' AND c.year = ?';
    params.push(year);
  }
  if (type) {
    sql += ' AND c.type = ?';
    params.push(type);
  }
  sql += ' ORDER BY c.rank ASC, c.id ASC';

  res.json(getDb().prepare(sql).all(...params));
});

// GET /api/competitions/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = getDb()
    .prepare(
      `SELECT c.*, cat.name AS category_name, cat.name_welsh AS category_name_welsh
       FROM competition c JOIN category cat ON c.category_id = cat.id
       WHERE c.id = ?`
    )
    .get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }
  res.json(row);
});

// POST /api/competitions
router.post('/', (req: Request, res: Response) => {
  const c = req.body as Competition;
  if (!c.id || !c.category_id || !c.year || !c.type) {
    res.status(400).json({ error: 'id, category_id, year, and type are required' });
    return;
  }
  const db = getDb();
  db.prepare(
    `INSERT INTO competition (id, category_id, description, language, year, type, extra_text, rank, preliminary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    c.id, c.category_id, c.description ?? null, c.language ?? null,
    c.year, c.type, c.extra_text ?? null, c.rank ?? 0, c.preliminary ?? null
  );
  res.status(201).json(db.prepare('SELECT * FROM competition WHERE id = ?').get(c.id));
});

// PUT /api/competitions/:id
router.put('/:id', (req: Request, res: Response) => {
  const c = req.body as Competition;
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE competition SET category_id=?, description=?, language=?, type=?,
       extra_text=?, rank=?, preliminary=? WHERE id=?`
    )
    .run(
      c.category_id, c.description ?? null, c.language ?? null, c.type,
      c.extra_text ?? null, c.rank ?? 0, c.preliminary ?? null, req.params.id
    );
  if (result.changes === 0) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }
  res.json(db.prepare('SELECT * FROM competition WHERE id = ?').get(req.params.id));
});

// DELETE /api/competitions/:id
router.delete('/:id', (req: Request, res: Response) => {
  const result = getDb().prepare('DELETE FROM competition WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }
  res.status(204).send();
});

export default router;

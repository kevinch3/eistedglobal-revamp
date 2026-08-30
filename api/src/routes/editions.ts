import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { editionCreateSchema, editionInputSchema, uploadInputSchema } from '../schemas';

const router = Router();
router.use(requireAuth);

router.get('/', (_req: Request, res: Response) => {
  res.json(getDb().prepare('SELECT * FROM edition ORDER BY year DESC').all());
});

router.get('/:id', (req: Request, res: Response) => {
  const row = getDb().prepare('SELECT * FROM edition WHERE year = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Edition not found' });
    return;
  }
  res.json(row);
});

router.post('/', validateBody(editionCreateSchema), (req: Request, res: Response) => {
  const { year } = req.body as { year?: number };
  if (!year) {
    res.status(400).json({ error: 'year is required' });
    return;
  }
  const db = getDb();
  const existing = db.prepare('SELECT year FROM edition WHERE year = ?').get(year);
  if (existing) {
    res.status(409).json({ error: 'Edition already exists' });
    return;
  }
  db.prepare('INSERT INTO edition (year) VALUES (?)').run(year);
  res.status(201).json(db.prepare('SELECT * FROM edition WHERE year = ?').get(year));
});

router.put('/:id', validateBody(editionInputSchema), (req: Request, res: Response) => {
  const { committee, committee_img, presenters, presenters_img } = req.body as Record<string, string>;
  const result = getDb()
    .prepare(
      'UPDATE edition SET committee=?, committee_img=?, presenters=?, presenters_img=? WHERE year=?'
    )
    .run(committee ?? null, committee_img ?? null, presenters ?? null, presenters_img ?? null, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Edition not found' });
    return;
  }
  res.json(getDb().prepare('SELECT * FROM edition WHERE year = ?').get(req.params.id));
});

// GET /api/editions/:id/uploads
router.get('/:id/uploads', (req: Request, res: Response) => {
  res.json(getDb().prepare('SELECT * FROM upload WHERE year = ?').all(req.params.id));
});

// POST /api/editions/:id/uploads
router.post('/:id/uploads', validateBody(uploadInputSchema), (req: Request, res: Response) => {
  const { filename, description } = req.body as { filename?: string; description?: string };
  if (!filename) {
    res.status(400).json({ error: 'filename is required' });
    return;
  }
  const db = getDb();
  const result = db
    .prepare('INSERT INTO upload (year, filename, description) VALUES (?, ?, ?)')
    .run(req.params.id, filename, description ?? null);
  res.status(201).json(db.prepare('SELECT * FROM upload WHERE id = ?').get(result.lastInsertRowid));
});

// DELETE /api/editions/:id — hard delete, no cascade.
// competition.year and upload.year reference edition(year), so an edition with
// any content is rejected by the foreign key and reported as 409 (see
// mapSqliteError). Deleting a whole year's data is deliberately not offered.
router.delete('/:id', (req: Request, res: Response) => {
  const result = getDb().prepare('DELETE FROM edition WHERE year = ?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Edition not found' }); return; }
  res.status(204).send();
});

export default router;

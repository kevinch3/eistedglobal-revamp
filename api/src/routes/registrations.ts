import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { Registration } from '../types';

const router = Router();
router.use(requireAuth);

// GET /api/registrations?year=2024&comp=CH202401&participant=5
router.get('/', (req: Request, res: Response) => {
  const { year, comp, participant, dropped } = req.query as {
    year?: string; comp?: string; participant?: string; dropped?: string;
  };

  // Dropped registrations were unconditionally hidden with no way to see them.
  // Default stays 0 so existing callers are unaffected.
  const droppedFilter =
    dropped === 'all' ? '' : dropped === '1' ? ' AND r.dropped = 1' : ' AND r.dropped = 0';

  let sql = `
    SELECT r.*, p.name, p.surname, p.type,
           c.description AS comp_description, c.language
    FROM registration r
    JOIN participant p ON r.participant_id = p.id
    JOIN competition c ON r.competition_id = c.id
    WHERE 1=1${droppedFilter}
  `;
  const params: unknown[] = [];

  if (year) { sql += ' AND r.year = ?'; params.push(year); }
  if (comp) { sql += ' AND r.competition_id = ?'; params.push(comp); }
  if (participant) { sql += ' AND r.participant_id = ?'; params.push(participant); }
  sql += ' ORDER BY p.surname ASC, p.name ASC';

  res.json(getDb().prepare(sql).all(...params));
});

// GET /api/registrations/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = getDb()
    .prepare(
      `SELECT r.*, p.name, p.surname FROM registration r
       JOIN participant p ON r.participant_id = p.id
       WHERE r.id = ?`
    )
    .get(req.params.id);
  if (!row) { res.status(404).json({ error: 'Registration not found' }); return; }
  res.json(row);
});

// POST /api/registrations
router.post('/', (req: Request, res: Response) => {
  const r = req.body as Registration;
  if (!r.participant_id || !r.competition_id || !r.year) {
    res.status(400).json({ error: 'participant_id, competition_id, and year are required' });
    return;
  }
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO registration (participant_id, competition_id, pseudonym, year)
       VALUES (?, ?, ?, ?)`
    )
    .run(r.participant_id, r.competition_id, r.pseudonym ?? null, r.year);
  res.status(201).json(db.prepare('SELECT * FROM registration WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/registrations/:id
router.put('/:id', (req: Request, res: Response) => {
  const { competition_id, pseudonym } = req.body as { competition_id?: string; pseudonym?: string };
  const db = getDb();
  const result = db
    .prepare('UPDATE registration SET competition_id=?, pseudonym=? WHERE id=?')
    .run(competition_id, pseudonym ?? null, req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Registration not found' }); return; }
  res.json(db.prepare('SELECT * FROM registration WHERE id = ?').get(req.params.id));
});

// PATCH /api/registrations/:id/drop — soft delete (withdrawal)
router.patch('/:id/drop', (req: Request, res: Response) => {
  const result = getDb()
    .prepare('UPDATE registration SET dropped = 1 WHERE id = ?')
    .run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Registration not found' }); return; }
  res.json({ message: 'Registration dropped' });
});

// DELETE /api/registrations/:id — hard delete.
// Distinct from PATCH /:id/drop, which withdraws but keeps the row. Without
// this there was no way to remove a registration at all, so a competition that
// ever had one could never be deleted and sandbox data accumulated forever.
// Nothing references registration(id), so removing the row is safe.
router.delete('/:id', (req: Request, res: Response) => {
  const result = getDb().prepare('DELETE FROM registration WHERE id = ?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Registration not found' }); return; }
  res.status(204).send();
});

export default router;

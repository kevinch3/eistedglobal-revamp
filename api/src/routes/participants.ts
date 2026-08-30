import { Router, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Participant } from '../types';
import { validateBody } from '../middleware/validate';
import { participantInputSchema } from '../schemas';

const router = Router();
router.use(requireAuth);

function normalizeActive(value: unknown, fallback = 1): number {
  if (value === undefined || value === null) return fallback ? 1 : 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value === 0 ? 0 : 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '0' || normalized === 'false') return 0;
    return 1;
  }
  return fallback ? 1 : 0;
}

// GET /api/participants?type=IND|GRU&q=search
router.get('/', (req: AuthRequest, res: Response) => {
  const { type, q, includeInactive } = req.query as {
    type?: string; q?: string; includeInactive?: string;
  };
  let sql = 'SELECT * FROM participant WHERE 1=1';
  const params: unknown[] = [];

  // Deleting a participant is a soft delete, but the list used to return them
  // anyway, so every caller had to filter client-side or silently show the
  // dead. Active-only is the sane default; ?includeInactive=1 opts back in (B3).
  if (includeInactive !== '1') sql += ' AND active = 1';

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (q) {
    sql += ' AND (name LIKE ? OR surname LIKE ? OR document_id LIKE ?)';
    const term = `%${q}%`;
    params.push(term, term, term);
  }
  sql += ' ORDER BY surname ASC, name ASC';

  res.json(getDb().prepare(sql).all(...params));
});

// GET /api/participants/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const row = getDb().prepare('SELECT * FROM participant WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }
  res.json(row);
});

// POST /api/participants
router.post('/', validateBody(participantInputSchema), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const p = req.body as Participant;

  if (!p.name || !p.type) {
    res.status(400).json({ error: 'name and type are required' });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO participant (name, surname, document_id, birth_date, nationality, residence, email, phone, type, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      p.name, p.surname ?? null, p.document_id ?? null, p.birth_date ?? null,
      p.nationality ?? null, p.residence ?? null, p.email ?? null,
      p.phone ?? null, p.type, normalizeActive((p as { active?: unknown }).active, 1)
    );

  res.status(201).json(db.prepare('SELECT * FROM participant WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/participants/:id
router.put('/:id', validateBody(participantInputSchema), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const p = req.body as Participant;

  const existing = db.prepare('SELECT id, active FROM participant WHERE id = ?').get(req.params.id) as
    | { id: number; active: number }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }

  const active = normalizeActive((p as { active?: unknown }).active, existing.active ?? 1);

  db.prepare(
    `UPDATE participant SET name=?, surname=?, document_id=?, birth_date=?, nationality=?,
     residence=?, email=?, phone=?, type=?, active=? WHERE id=?`
  ).run(
    p.name, p.surname ?? null, p.document_id ?? null, p.birth_date ?? null,
    p.nationality ?? null, p.residence ?? null, p.email ?? null,
    p.phone ?? null, p.type, active, req.params.id
  );

  res.json(db.prepare('SELECT * FROM participant WHERE id = ?').get(req.params.id));
});

// DELETE /api/participants/:id  — soft by default (active = 0), ?hard=1 removes.
//
// The soft delete keeps the row forever, so generated or imported participants
// accumulate with no way to reclaim them. ?hard=1 removes the row; foreign keys
// from registration and work protect anything still referenced, which surfaces
// as 409 (see mapSqliteError), so a real entrant can never be lost this way.
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const hard = (req.query as { hard?: string }).hard === '1';
  const result = hard
    ? db.prepare('DELETE FROM participant WHERE id = ?').run(req.params.id)
    : db.prepare('UPDATE participant SET active = 0 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Participant not found' });
    return;
  }
  res.status(204).send();
});

export default router;

import { Router, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Persona } from '../types';

const router = Router();
router.use(requireAuth);

function normalizeActivo(value: unknown, fallback = 1): number {
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

// GET /api/personas?tipo=IND|GRU&q=search&anio=2024
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { tipo, q } = req.query as { tipo?: string; q?: string };

  let sql = 'SELECT * FROM persona WHERE 1=1';
  const params: unknown[] = [];

  if (tipo) {
    sql += ' AND tipo = ?';
    params.push(tipo);
  }
  if (q) {
    sql += ' AND (nombre LIKE ? OR apellido LIKE ? OR dni LIKE ?)';
    const term = `%${q}%`;
    params.push(term, term, term);
  }
  sql += ' ORDER BY apellido ASC, nombre ASC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// GET /api/personas/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM persona WHERE id_persona = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Persona no encontrada' });
    return;
  }
  res.json(row);
});

// POST /api/personas
router.post('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const p = req.body as Persona;

  if (!p.nombre || !p.tipo) {
    res.status(400).json({ error: 'nombre y tipo son requeridos' });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO persona (nombre, apellido, dni, fecha_nac, nacionalidad, residencia, email, telefono, tipo, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      p.nombre, p.apellido ?? null, p.dni ?? null, p.fecha_nac ?? null,
      p.nacionalidad ?? null, p.residencia ?? null, p.email ?? null,
      p.telefono ?? null, p.tipo, normalizeActivo((p as { activo?: unknown }).activo, 1)
    );

  const created = db.prepare('SELECT * FROM persona WHERE id_persona = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/personas/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const p = req.body as Persona;

  const existing = db.prepare('SELECT id_persona, activo FROM persona WHERE id_persona = ?').get(req.params.id) as
    | { id_persona: number; activo: number }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Persona no encontrada' });
    return;
  }

  const activo = normalizeActivo((p as { activo?: unknown }).activo, existing.activo ?? 1);

  db.prepare(
    `UPDATE persona SET nombre=?, apellido=?, dni=?, fecha_nac=?, nacionalidad=?,
     residencia=?, email=?, telefono=?, tipo=?, activo=? WHERE id_persona=?`
  ).run(
    p.nombre, p.apellido ?? null, p.dni ?? null, p.fecha_nac ?? null,
    p.nacionalidad ?? null, p.residencia ?? null, p.email ?? null,
    p.telefono ?? null, p.tipo, activo, req.params.id
  );

  const updated = db.prepare('SELECT * FROM persona WHERE id_persona = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/personas/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM persona WHERE id_persona = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Persona no encontrada' });
    return;
  }
  res.status(204).send();
});

export default router;

import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { Obra } from '../types';

const router = Router();
router.use(requireAuth);

// GET /api/obras?comp=CH202401&persona=5
router.get('/', (req: Request, res: Response) => {
  const { comp, persona } = req.query as { comp?: string; persona?: string };
  let sql = `
    SELECT o.*, p.nombre, p.apellido, p.tipo
    FROM obra o
    JOIN persona p ON o.fk_particip = p.id_persona
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (comp) { sql += ' AND o.competencia = ?'; params.push(comp); }
  if (persona) { sql += ' AND o.fk_particip = ?'; params.push(persona); }
  sql += ' ORDER BY o.puesto ASC, o.nom_obra ASC';

  res.json(getDb().prepare(sql).all(...params));
});

// GET /api/obras/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = getDb()
    .prepare(
      `SELECT o.*, p.nombre, p.apellido FROM obra o
       JOIN persona p ON o.fk_particip = p.id_persona
       WHERE o.id_obra = ?`
    )
    .get(req.params.id);
  if (!row) { res.status(404).json({ error: 'Obra no encontrada' }); return; }
  res.json(row);
});

// POST /api/obras
router.post('/', (req: Request, res: Response) => {
  const o = req.body as Obra;
  if (!o.fk_particip || !o.competencia || !o.nom_obra) {
    res.status(400).json({ error: 'fk_particip, competencia y nom_obra son requeridos' });
    return;
  }
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO obra (fk_particip, mod_particip, puesto, competencia, nom_obra, video_urls, photo_urls)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      o.fk_particip, o.mod_particip ?? null, o.puesto ?? null,
      o.competencia, o.nom_obra, o.video_urls ?? null, o.photo_urls ?? null
    );
  res.status(201).json(db.prepare('SELECT * FROM obra WHERE id_obra = ?').get(result.lastInsertRowid));
});

// PUT /api/obras/:id
router.put('/:id', (req: Request, res: Response) => {
  const o = req.body as Obra;
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE obra SET mod_particip=?, puesto=?, nom_obra=?, video_urls=?, photo_urls=?
       WHERE id_obra=?`
    )
    .run(
      o.mod_particip ?? null, o.puesto ?? null, o.nom_obra,
      o.video_urls ?? null, o.photo_urls ?? null, req.params.id
    );
  if (result.changes === 0) { res.status(404).json({ error: 'Obra no encontrada' }); return; }
  res.json(db.prepare('SELECT * FROM obra WHERE id_obra = ?').get(req.params.id));
});

// DELETE /api/obras/:id
router.delete('/:id', (req: Request, res: Response) => {
  const result = getDb().prepare('DELETE FROM obra WHERE id_obra = ?').run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Obra no encontrada' }); return; }
  res.status(204).send();
});

export default router;

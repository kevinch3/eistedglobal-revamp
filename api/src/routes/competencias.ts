import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { Competencia } from '../types';

const router = Router();
router.use(requireAuth);

// GET /api/competencias?anio=2024&grupind=IND
router.get('/', (req: Request, res: Response) => {
  const { anio, grupind } = req.query as { anio?: string; grupind?: string };
  let sql = `
    SELECT c.*, cat.nombre AS cat_nombre, cat.nomcym AS cat_nomcym
    FROM competencia c
    JOIN categoria cat ON c.categoria = cat.id_cat
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (anio) {
    sql += ' AND c.fk_anio = ?';
    params.push(anio);
  }
  if (grupind) {
    sql += ' AND c.grupind = ?';
    params.push(grupind);
  }
  sql += ' ORDER BY c.rank ASC, c.id_comp ASC';

  res.json(getDb().prepare(sql).all(...params));
});

// GET /api/competencias/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = getDb()
    .prepare(
      `SELECT c.*, cat.nombre AS cat_nombre, cat.nomcym AS cat_nomcym
       FROM competencia c JOIN categoria cat ON c.categoria = cat.id_cat
       WHERE c.id_comp = ?`
    )
    .get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Competencia no encontrada' });
    return;
  }
  res.json(row);
});

// POST /api/competencias
router.post('/', (req: Request, res: Response) => {
  const c = req.body as Competencia;
  if (!c.id_comp || !c.categoria || !c.fk_anio || !c.grupind) {
    res.status(400).json({ error: 'id_comp, categoria, fk_anio y grupind son requeridos' });
    return;
  }
  const db = getDb();
  db.prepare(
    `INSERT INTO competencia (id_comp, categoria, descripcion, idioma, fk_anio, grupind, xt_texto, rank, preliminar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    c.id_comp, c.categoria, c.descripcion ?? null, c.idioma ?? null,
    c.fk_anio, c.grupind, c.xt_texto ?? null, c.rank ?? 0, c.preliminar ?? null
  );
  res.status(201).json(db.prepare('SELECT * FROM competencia WHERE id_comp = ?').get(c.id_comp));
});

// PUT /api/competencias/:id
router.put('/:id', (req: Request, res: Response) => {
  const c = req.body as Competencia;
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE competencia SET categoria=?, descripcion=?, idioma=?, grupind=?,
       xt_texto=?, rank=?, preliminar=? WHERE id_comp=?`
    )
    .run(
      c.categoria, c.descripcion ?? null, c.idioma ?? null, c.grupind,
      c.xt_texto ?? null, c.rank ?? 0, c.preliminar ?? null, req.params.id
    );
  if (result.changes === 0) {
    res.status(404).json({ error: 'Competencia no encontrada' });
    return;
  }
  res.json(db.prepare('SELECT * FROM competencia WHERE id_comp = ?').get(req.params.id));
});

// DELETE /api/competencias/:id
router.delete('/:id', (req: Request, res: Response) => {
  const result = getDb().prepare('DELETE FROM competencia WHERE id_comp = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Competencia no encontrada' });
    return;
  }
  res.status(204).send();
});

export default router;

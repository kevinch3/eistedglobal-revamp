import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { Inscripto } from '../types';

const router = Router();
router.use(requireAuth);

// GET /api/inscriptos?anio=2024&comp=CH202401&persona=5
router.get('/', (req: Request, res: Response) => {
  const { anio, comp, persona } = req.query as { anio?: string; comp?: string; persona?: string };
  let sql = `
    SELECT i.*, p.nombre, p.apellido, p.tipo,
           c.descripcion AS comp_descripcion, c.idioma
    FROM inscriptos i
    JOIN persona p ON i.fk_persona = p.id_persona
    JOIN competencia c ON i.fk_comp = c.id_comp
    WHERE i.baja = 0
  `;
  const params: unknown[] = [];

  if (anio) { sql += ' AND i.anio_insc = ?'; params.push(anio); }
  if (comp) { sql += ' AND i.fk_comp = ?'; params.push(comp); }
  if (persona) { sql += ' AND i.fk_persona = ?'; params.push(persona); }
  sql += ' ORDER BY p.apellido ASC, p.nombre ASC';

  res.json(getDb().prepare(sql).all(...params));
});

// GET /api/inscriptos/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = getDb()
    .prepare(
      `SELECT i.*, p.nombre, p.apellido FROM inscriptos i
       JOIN persona p ON i.fk_persona = p.id_persona
       WHERE i.id_inscripto = ?`
    )
    .get(req.params.id);
  if (!row) { res.status(404).json({ error: 'Inscripto no encontrado' }); return; }
  res.json(row);
});

// POST /api/inscriptos
router.post('/', (req: Request, res: Response) => {
  const i = req.body as Inscripto;
  if (!i.fk_persona || !i.fk_comp || !i.anio_insc) {
    res.status(400).json({ error: 'fk_persona, fk_comp y anio_insc son requeridos' });
    return;
  }
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO inscriptos (fk_persona, fk_comp, seudonimo, anio_insc)
       VALUES (?, ?, ?, ?)`
    )
    .run(i.fk_persona, i.fk_comp, i.seudonimo ?? null, i.anio_insc);
  res.status(201).json(db.prepare('SELECT * FROM inscriptos WHERE id_inscripto = ?').get(result.lastInsertRowid));
});

// PUT /api/inscriptos/:id
router.put('/:id', (req: Request, res: Response) => {
  const { fk_comp, seudonimo } = req.body as { fk_comp?: string; seudonimo?: string };
  const db = getDb();
  const result = db
    .prepare('UPDATE inscriptos SET fk_comp=?, seudonimo=? WHERE id_inscripto=?')
    .run(fk_comp, seudonimo ?? null, req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Inscripto no encontrado' }); return; }
  res.json(db.prepare('SELECT * FROM inscriptos WHERE id_inscripto = ?').get(req.params.id));
});

// PATCH /api/inscriptos/:id/baja — soft delete (withdrawal)
router.patch('/:id/baja', (req: Request, res: Response) => {
  const result = getDb()
    .prepare('UPDATE inscriptos SET baja = 1 WHERE id_inscripto = ?')
    .run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Inscripto no encontrado' }); return; }
  res.json({ message: 'Inscripción dada de baja' });
});

export default router;

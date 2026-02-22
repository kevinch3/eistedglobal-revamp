import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', (_req: Request, res: Response) => {
  const rows = getDb().prepare('SELECT * FROM anio ORDER BY id_anio DESC').all();
  res.json(rows);
});

router.get('/:id', (req: Request, res: Response) => {
  const row = getDb().prepare('SELECT * FROM anio WHERE id_anio = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Año no encontrado' });
    return;
  }
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const { id_anio } = req.body as { id_anio?: number };
  if (!id_anio) {
    res.status(400).json({ error: 'id_anio es requerido' });
    return;
  }
  const db = getDb();
  const existing = db.prepare('SELECT id_anio FROM anio WHERE id_anio = ?').get(id_anio);
  if (existing) {
    res.status(409).json({ error: 'El año ya existe' });
    return;
  }
  db.prepare('INSERT INTO anio (id_anio) VALUES (?)').run(id_anio);
  res.status(201).json(db.prepare('SELECT * FROM anio WHERE id_anio = ?').get(id_anio));
});

router.put('/:id', (req: Request, res: Response) => {
  const { comision, comision_img, presentadores, presentadores_img } = req.body as Record<string, string>;
  const result = getDb()
    .prepare(
      'UPDATE anio SET comision=?, comision_img=?, presentadores=?, presentadores_img=? WHERE id_anio=?'
    )
    .run(comision ?? null, comision_img ?? null, presentadores ?? null, presentadores_img ?? null, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Año no encontrado' });
    return;
  }
  res.json(getDb().prepare('SELECT * FROM anio WHERE id_anio = ?').get(req.params.id));
});

// GET /api/anios/:id/subidas
router.get('/:id/subidas', (req: Request, res: Response) => {
  const rows = getDb().prepare('SELECT * FROM subida WHERE id_anio = ?').all(req.params.id);
  res.json(rows);
});

// POST /api/anios/:id/subidas
router.post('/:id/subidas', (req: Request, res: Response) => {
  const { archivo, descripcion } = req.body as { archivo?: string; descripcion?: string };
  if (!archivo) {
    res.status(400).json({ error: 'archivo es requerido' });
    return;
  }
  const db = getDb();
  const result = db
    .prepare('INSERT INTO subida (id_anio, archivo, descripcion) VALUES (?, ?, ?)')
    .run(req.params.id, archivo, descripcion ?? null);
  res.status(201).json(db.prepare('SELECT * FROM subida WHERE id = ?').get(result.lastInsertRowid));
});

export default router;

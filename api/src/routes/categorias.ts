import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', (_req: Request, res: Response) => {
  const rows = getDb().prepare('SELECT * FROM categoria ORDER BY nombre ASC').all();
  res.json(rows);
});

router.post('/', (req: Request, res: Response) => {
  const { nombre, nomcym } = req.body as { nombre?: string; nomcym?: string };
  if (!nombre) {
    res.status(400).json({ error: 'nombre es requerido' });
    return;
  }
  const result = getDb()
    .prepare('INSERT INTO categoria (nombre, nomcym) VALUES (?, ?)')
    .run(nombre, nomcym ?? null);
  const created = getDb().prepare('SELECT * FROM categoria WHERE id_cat = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req: Request, res: Response) => {
  const { nombre, nomcym } = req.body as { nombre?: string; nomcym?: string };
  const result = getDb()
    .prepare('UPDATE categoria SET nombre=?, nomcym=? WHERE id_cat=?')
    .run(nombre, nomcym ?? null, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Categoría no encontrada' });
    return;
  }
  res.json(getDb().prepare('SELECT * FROM categoria WHERE id_cat = ?').get(req.params.id));
});

router.delete('/:id', (req: Request, res: Response) => {
  const result = getDb().prepare('DELETE FROM categoria WHERE id_cat = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Categoría no encontrada' });
    return;
  }
  res.status(204).send();
});

export default router;

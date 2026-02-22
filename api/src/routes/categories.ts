import { Router, Request, Response } from 'express';
import { getDb } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', (_req: Request, res: Response) => {
  res.json(getDb().prepare('SELECT * FROM category ORDER BY name ASC').all());
});

router.post('/', (req: Request, res: Response) => {
  const { name, name_welsh } = req.body as { name?: string; name_welsh?: string };
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const result = getDb()
    .prepare('INSERT INTO category (name, name_welsh) VALUES (?, ?)')
    .run(name, name_welsh ?? null);
  res.status(201).json(getDb().prepare('SELECT * FROM category WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req: Request, res: Response) => {
  const { name, name_welsh } = req.body as { name?: string; name_welsh?: string };
  const result = getDb()
    .prepare('UPDATE category SET name=?, name_welsh=? WHERE id=?')
    .run(name, name_welsh ?? null, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  res.json(getDb().prepare('SELECT * FROM category WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req: Request, res: Response) => {
  const result = getDb().prepare('DELETE FROM category WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  res.status(204).send();
});

export default router;

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM usuario WHERE username = ?').get(username) as
    | { id: number; username: string; password: string; nombre: string }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any }
  );

  res.json({ token, nombre: user.nombre, username: user.username });
});

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

export default router;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { getDb } from './config/database';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import personasRoutes from './routes/personas';
import categoriasRoutes from './routes/categorias';
import aniosRoutes from './routes/anios';
import competenciasRoutes from './routes/competencias';
import inscriptosRoutes from './routes/inscriptos';
import obrasRoutes from './routes/obras';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize DB on startup
getDb();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/anios', aniosRoutes);
app.use('/api/competencias', competenciasRoutes);
app.use('/api/inscriptos', inscriptosRoutes);
app.use('/api/obras', obrasRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\nEistedGlobal API running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop\n');
});

export default app;

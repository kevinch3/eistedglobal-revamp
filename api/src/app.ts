import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { getDb } from './config/database';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import participantsRoutes from './routes/participants';
import categoriesRoutes from './routes/categories';
import editionsRoutes from './routes/editions';
import competitionsRoutes from './routes/competitions';
import registrationsRoutes from './routes/registrations';
import worksRoutes from './routes/works';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize DB on startup
getDb();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/editions', editionsRoutes);
app.use('/api/competitions', competitionsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/works', worksRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\nEistedGlobal API running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop\n');
});

export default app;

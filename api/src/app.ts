// Builds and exports the Express app WITHOUT listening, so tests and tooling can
// import it (supertest, route introspection, contract checks). The process entry
// point is server.ts — see package.json `main`/`start`.
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

// Open the database (and create the schema if missing) before serving.
getDb();

app.use(helmet());
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200').split(',').map(o => o.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
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

export default app;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { prisma } from './lib/db.js';
import { authRoutes } from './routes/auth.js';
import { dataRoutes } from './routes/data.js';
import { userRoutes } from './routes/users.js';
import { syncRoutes } from './routes/sync.js';
import { targetRoutes } from './routes/targets.js';
import { settingsRoutes } from './routes/settings.js';
import { storeRoutes } from './routes/stores.js';
import { packageRoutes } from './routes/packages.js';
import { userAssignmentRoutes } from './routes/user-assignments.js';
import { eventTypeRoutes } from './routes/event-types.js';
import { resumeAllSyncJobs } from './jobs/sync-excel365.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (reverse proxy nginx)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/user-assignments', userAssignmentRoutes);
app.use('/api/event-types', eventTypeRoutes);

// Serve uploaded files (avatars) — nosniff prevents content-type sniffing attacks
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  resumeAllSyncJobs().catch((err) => console.error('Failed to resume sync jobs:', err));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received — shutting down gracefully');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

export default app;

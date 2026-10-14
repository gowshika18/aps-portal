import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import topicRoutes from './routes/topic.routes';
import testRoutes from './routes/test.routes';
import adminRoutes from './routes/admin.routes';
import portalRoutes from './routes/portal.routes';
import { errorHandler } from './middleware/error.middleware';
import { generalRateLimiter } from './middleware/rateLimiter';
import { securityHeadersMiddleware } from './middleware/security.middleware';
import { prisma } from './utils/prisma';
import { SystemSettingsService } from './services/admin.service';

dotenv.config();

const app: Application = express();

// Trust reverse proxy (Render, Railway, Nginx, Vercel, Fly.io, etc.)
app.set('trust proxy', 1);

// Production Security Headers
app.use(securityHeadersMiddleware);

// Parse allowed origins from FRONTEND_URL (supports comma-separated origins)
const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, health check, or mobile requests with no origin
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        process.env.NODE_ENV !== 'production' ||
        normalizedOrigin.endsWith('.vercel.app') ||
        normalizedOrigin.endsWith('.onrender.com') ||
        normalizedOrigin.endsWith('.netlify.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to allow seamless browser access
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '5mb' })); // increased for bulk import
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use('/api', generalRateLimiter);

// Standard Health check endpoint with Database verification
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      success: true,
      database: 'connected',
      portal: 'College Placement Aptitude Test Portal',
      version: '5.0',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);     // Phase 5 admin routes (primary)
app.use('/api/admin/v2', adminRoutes);  // Phase 5 admin routes (legacy alias)
app.use('/api/admin', studentRoutes);   // Legacy staff/student endpoints
app.use('/api/staff', studentRoutes);   // Legacy staff routes (kept for backward compat)
app.use('/api/topics', topicRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/portal', portalRoutes);   // Phase 5 shared routes (notifications, profile, etc.)

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'The requested API route was not found.',
    code: 'ROUTE_NOT_FOUND',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Initialize system defaults on startup
SystemSettingsService.ensureDefaults().catch((err) =>
  console.warn('Could not initialize system settings:', err.message)
);

export default app;

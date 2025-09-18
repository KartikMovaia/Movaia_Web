import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';


// Import routes
import authRoutes from './modules/auth/routes/auth.routes';
import coachRoutes from './modules/coach/routes/coach.routes';
import adminRoutes from './modules/admin/routes/admin.routes';
import videoRoutes from './modules/video/routes/video.routes';
// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Create Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Running Form Analysis API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test database connection
app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    const coachCount = await prisma.user.count({
      where: { accountType: 'COACH' }
    });
    const individualCount = await prisma.user.count({
      where: { accountType: 'INDIVIDUAL' }
    });
    const athleteCount = await prisma.user.count({
      where: { accountType: 'ATHLETE_LIMITED' }
    });
    const adminCount = await prisma.user.count({
      where: { accountType: 'ADMIN' }
    });
    
    res.json({
      status: 'connected',
      message: 'Database connection successful',
      stats: {
        totalUsers: userCount,
        coaches: coachCount,
        individuals: individualCount,
        limitedAthletes: athleteCount,
        admins: adminCount
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/videos', videoRoutes);

// Basic route for testing
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Running Form Analysis API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      testDb: '/api/test-db',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        refresh: 'POST /api/auth/refresh',
        changePassword: 'POST /api/auth/change-password'
      },
      coach: {
        createAthlete: 'POST /api/coach/athletes',
        getAthletes: 'GET /api/coach/athletes',
        getAthlete: 'GET /api/coach/athletes/:id',
        updateAthlete: 'PUT /api/coach/athletes/:id',
        resetPassword: 'POST /api/coach/athletes/:id/reset-password',
        removeAthlete: 'DELETE /api/coach/athletes/:id'
      },
      admin: {
        dashboard: {
          metrics: 'GET /api/admin/dashboard/metrics',
          stats: 'GET /api/admin/dashboard/stats'
        },
        users: {
          list: 'GET /api/admin/users',
          get: 'GET /api/admin/users/:userId',
          update: 'PUT /api/admin/users/:userId',
          suspend: 'POST /api/admin/users/:userId/suspend',
          delete: 'DELETE /api/admin/users/:userId'
        },
        subscriptions: {
          list: 'GET /api/admin/subscriptions',
          metrics: 'GET /api/admin/subscriptions/metrics',
          update: 'PUT /api/admin/subscriptions/:id',
          cancel: 'POST /api/admin/subscriptions/:id/cancel'
        },
        revenue: {
          analytics: 'GET /api/admin/revenue/analytics',
          period: 'GET /api/admin/revenue/period',
          churn: 'GET /api/admin/revenue/churn'
        },
        activity: {
          logs: 'GET /api/admin/activity/logs',
          metrics: 'GET /api/admin/activity/metrics'
        },
        export: {
          users: 'GET /api/admin/export/users',
          analytics: 'GET /api/admin/export/analytics',
          revenue: 'GET /api/admin/export/revenue'
        }
      }
    }
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`âš¡ï¸[server]: Server is running at http://localhost:${PORT}`);
  console.log(`âš¡ï¸[server]: API endpoints available at http://localhost:${PORT}/api`);
  console.log(`âš¡ï¸[server]: Environment: ${process.env.NODE_ENV}`);
  console.log(`âš¡ï¸[server]: Admin dashboard available at http://localhost:${PORT}/api/admin`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await prisma.$disconnect();
});

export default app;
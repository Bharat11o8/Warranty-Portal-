import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Security middleware imports
import { securityHeaders, requestIdMiddleware, enhancedLogger } from './middleware/security.js';
import { authRateLimiter, generalApiLimiter } from './middleware/rateLimit.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import warrantyRoutes from './routes/warranty.routes.js';
import adminRoutes from './routes/admin.routes.js';
import publicRoutes from './routes/public.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import grievanceRoutes from './routes/grievance.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import oldWarrantiesRoutes from './routes/old-warranties.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import posmRoutes from './routes/posm.routes.js';
import uidRoutes from './routes/uid.routes.js';
import { AssignmentSchedulerService } from './services/assignment-scheduler.service.js';
import { initSocket } from './socket.js';
import { getISTTimestamp } from './utils/dateUtils.js';
import { getDbRetryStats, pingDatabase } from './config/database.js';

// Start background services
AssignmentSchedulerService.start();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '../.env') });

// SBP-004: Validate required secrets at startup — crash fast if missing
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
initSocket(httpServer);

// Enable trust proxy for rate limiting behind load balancers/proxies
app.set('trust proxy', 1);

// ===========================================
// SECURITY MIDDLEWARE (Applied First)
// ===========================================

// Security headers (Helmet.js)
app.use(securityHeaders);

// Cookie parser (SBP-006: for HttpOnly cookie auth)
app.use(cookieParser());

// Request ID tracking for debugging/tracing
app.use(requestIdMiddleware);

// Enhanced request logger (production-safe)
app.use(enhancedLogger);

// ===========================================
// CORS CONFIGURATION
// ===========================================

// Parse allowed origins from environment
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8080',
    'https://warranty.emporiobyautoform.in',
    'https://server-bharat-maheshwaris-projects.vercel.app'
  ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Request-Id', 'X-Api-Key']
}));

// ===========================================
// COMPRESSION (Gzip/Brotli for smaller responses)
// ===========================================

app.use(compression());

// ===========================================
// BODY PARSERS
// ===========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// HEALTH CHECK (No rate limiting)
// ===========================================

app.get('/health', async (req, res) => {
  const includeDb = req.query.db === '1';
  const dbReachable = includeDb ? await pingDatabase() : undefined;

  res.json({
    status: 'ok',
    message: 'Warranty Portal API is running',
    timestamp: getISTTimestamp(),
    db: includeDb ? { reachable: dbReachable } : undefined,
    dbRetryStats: getDbRetryStats()
  });
});

// ===========================================
// API ROUTES WITH RATE LIMITING
// ===========================================

// Auth routes with strict rate limiting
app.use('/api/auth', authRateLimiter, authRoutes);

// Other API routes with general rate limiting
app.use('/api/vendor', generalApiLimiter, vendorRoutes);
app.use('/api/warranty', generalApiLimiter, warrantyRoutes);
app.use('/api/admin', generalApiLimiter, adminRoutes);
app.use('/api/public', generalApiLimiter, publicRoutes);
app.use('/api/catalog', generalApiLimiter, catalogRoutes);
app.use('/api/grievance', generalApiLimiter, grievanceRoutes);
app.use('/api/assignment', generalApiLimiter, assignmentRoutes);
app.use('/api/notifications', generalApiLimiter, notificationRoutes);
app.use('/api/upload', generalApiLimiter, uploadRoutes);
app.use('/api/admin/old-warranties', generalApiLimiter, oldWarrantiesRoutes);
app.use('/api/settings', generalApiLimiter, settingsRoutes);
app.use('/api/posm', generalApiLimiter, posmRoutes);
app.use('/api/uid', generalApiLimiter, uidRoutes);

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// ===========================================
// START SERVER
// ===========================================

if (process.env.VERCEL !== '1') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io: Initialized`);
    console.log(`📧 Email service: ${process.env.EMAIL_SERVICE}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME}`);
    console.log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`);
    console.log(`🔒 Security: Helmet.js enabled`);
    console.log(`⏱️  Rate limiting: Enabled`);
  });
}

export default app;

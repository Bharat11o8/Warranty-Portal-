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
import analyticsRoutes from './routes/analytics.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import oldWarrantiesRoutes from './routes/old-warranties.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import posmRoutes from './routes/posm.routes.js';
import uidRoutes from './routes/uid.routes.js';
import orderRoutes from './routes/order.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import { AssignmentSchedulerService } from './services/assignment-scheduler.service.js';
import { WarrantyReminderScheduler } from './services/warrantyReminder.service.js';
import { startAnalyticsRepairSchedule } from './services/analyticsEvents.service.js';
import { initSocket } from './socket.js';
import { getISTTimestamp } from './utils/dateUtils.js';
import pool, { getDbRetryStats, pingDatabase } from './config/database.js';
import { ensureCustomerMobileLimitTable } from './utils/customerMobileLimits.js';

// Keep the process alive on stray async errors. A single unhandled promise
// rejection (e.g. a transient DB error in a background task) would otherwise
// terminate the whole server. Log it and keep serving — pm2 no longer sees a
// dead-but-"online" process.
process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ Unhandled promise rejection (kept alive):', reason?.message || reason);
});
process.on('uncaughtException', (err: any) => {
  console.error('⚠️ Uncaught exception (kept alive):', err?.message || err);
});

// Run inline database migrations
async function runMigrations() {
  try {
    const [columns]: any = await pool.query("SHOW COLUMNS FROM pre_generated_uids LIKE 'product_name'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE pre_generated_uids ADD COLUMN product_name VARCHAR(255) DEFAULT NULL");
      console.log('✅ Migration: Added product_name to pre_generated_uids.');
    } else {
      console.log('ℹ️ Migration: product_name already exists in pre_generated_uids.');
    }

    // Per-user failed-OTP counter. Redis holds it when available; this column
    // is the fallback so the guess limit still applies if Redis is unreachable.
    const [otpAttemptCol]: any = await pool.query("SHOW COLUMNS FROM otp_codes LIKE 'attempts'");
    if (otpAttemptCol.length === 0) {
      await pool.query("ALTER TABLE otp_codes ADD COLUMN attempts INT NOT NULL DEFAULT 0");
      console.log('✅ Migration: Added attempts to otp_codes.');
    } else {
      console.log('ℹ️ Migration: attempts already exists in otp_codes.');
    }

    // Who rejected a warranty. The reminder job chases HO rejections only — a
    // customer must never be asked to "correct" something their own dealer
    // turned down. Backfilled below for rows that predate the column.
    const [rejectedByCol]: any = await pool.query("SHOW COLUMNS FROM warranty_registrations LIKE 'rejected_by'");
    if (rejectedByCol.length === 0) {
      await pool.query(
        "ALTER TABLE warranty_registrations ADD COLUMN rejected_by ENUM('admin','vendor') DEFAULT NULL"
      );

      // The two dealer paths that reject from WhatsApp / email write a fixed
      // sentence, so those are identified exactly.
      const [byReason]: any = await pool.query(
        `UPDATE warranty_registrations
         SET rejected_by = 'vendor'
         WHERE status = 'rejected' AND rejected_by IS NULL AND rejection_reason IN (
           'Franchise store could not confirm this installation.',
           'Installation rejected by Vendor/Franchise via email verification.'
         )`
      );

      // A dealer can only reject before approving, so a recorded dealer
      // approval means someone else did the rejecting.
      const [byApproval]: any = await pool.query(
        `UPDATE warranty_registrations
         SET rejected_by = 'admin'
         WHERE status = 'rejected' AND rejected_by IS NULL AND vendor_approved_at IS NOT NULL`
      );

      // Anything still NULL is genuinely ambiguous: free-text reason, no
      // recorded dealer approval. Left NULL on purpose — the reminder job
      // treats unknown as "do not send" rather than guessing.
      const [ambiguous]: any = await pool.query(
        "SELECT COUNT(*) AS n FROM warranty_registrations WHERE status = 'rejected' AND rejected_by IS NULL"
      );
      console.log(
        `✅ Migration: Added rejected_by. Classified ${byReason.affectedRows} as vendor, ` +
        `${byApproval.affectedRows} as admin; ${ambiguous[0].n} left unclassified.`
      );
    } else {
      console.log('ℹ️ Migration: rejected_by already exists in warranty_registrations.');
    }

    // Second pass over rejections the first backfill could not attribute.
    // Runs whenever any are left, because the first pass only ran when the
    // column was created and two better signals were found afterwards.
    const [stillNull]: any = await pool.query(
      "SELECT COUNT(*) AS n FROM warranty_registrations WHERE status = 'rejected' AND rejected_by IS NULL"
    );
    if (stillNull[0].n > 0) {
      // A store name on the rejection event is positive evidence a dealer did
      // it. The reverse is not true: the original backfill wrote 'system_admin'
      // onto every row it touched, so that value proves nothing.
      const [byActor]: any = await pool.query(
        `UPDATE warranty_registrations w
         JOIN analytics_events ae ON ae.warranty_id = w.id AND ae.action_type = 'rejected'
         SET w.rejected_by = 'vendor'
         WHERE w.status = 'rejected' AND w.rejected_by IS NULL
           AND ae.performed_by IS NOT NULL AND ae.performed_by <> '' AND ae.performed_by <> 'system_admin'`
      );

      // A warranty raised on the franchise dashboard starts at 'pending', and
      // the dealer's reject endpoint only accepts 'pending_vendor'. So the
      // dealer never had the chance — the rejection can only have been HO's.
      const [bySource]: any = await pool.query(
        `UPDATE warranty_registrations
         SET rejected_by = 'admin'
         WHERE status = 'rejected' AND rejected_by IS NULL
           AND JSON_UNQUOTE(JSON_EXTRACT(product_details, '$.submissionSource')) = 'Franchise Dashboard'`
      );

      const [remaining]: any = await pool.query(
        "SELECT COUNT(*) AS n FROM warranty_registrations WHERE status = 'rejected' AND rejected_by IS NULL"
      );
      console.log(
        `✅ Migration: re-checked ${stillNull[0].n} unattributed rejections — ` +
        `${byActor.affectedRows} resolved to vendor, ${bySource.affectedRows} to admin, ${remaining[0].n} still unknown.`
      );
    }

    // Reminder bookkeeping. Kept on the warranty rather than derived from
    // message_logs so the daily query stays a single indexed scan and the admin
    // list can show "reminded 2x, last 5 days ago" without a join.
    const [reminderCols]: any = await pool.query("SHOW COLUMNS FROM warranty_registrations LIKE 'reminder_count'");
    if (reminderCols.length === 0) {
      await pool.query(
        `ALTER TABLE warranty_registrations
           ADD COLUMN reminder_count INT NOT NULL DEFAULT 0,
           ADD COLUMN last_reminder_at DATETIME DEFAULT NULL`
      );
      console.log('✅ Migration: Added reminder_count/last_reminder_at to warranty_registrations.');
    } else {
      console.log('ℹ️ Migration: reminder columns already exist in warranty_registrations.');
    }

    await ensureCustomerMobileLimitTable();
    console.log('Migration: customer_mobile_limits is ready.');
  } catch (error: any) {
    console.error('❌ Migration Error:', error.message);
    throw error;
  }
}

// Wait for the database to become reachable before running startup migrations.
// On a VPS reboot / MySQL restart / transient network blip, the DB can be briefly
// unavailable exactly when the process boots. Without this, runMigrations() threw
// at the top level and the whole process exited — pm2 reported "online" while
// nothing listened on the port, producing a 502 until a manual restart.
async function waitForDatabase(maxAttempts = 30, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await pingDatabase()) {
      if (attempt > 1) console.log(`✅ Database reachable after ${attempt} attempt(s).`);
      return true;
    }
    console.warn(`⏳ Database not reachable yet (attempt ${attempt}/${maxAttempts}); retrying in ${delayMs}ms...`);
    await new Promise(res => setTimeout(res, delayMs));
  }
  return false;
}

// Start background services. Boot is resilient: if the DB can't be reached or a
// migration fails, we log it and still start the HTTP server so the API serves
// traffic (and recovers) instead of the process crashing and 502-ing.
const dbReady = await waitForDatabase();
if (dbReady) {
  try {
    await runMigrations();
  } catch (err: any) {
    console.error('⚠️ Startup migrations failed — continuing to start the server anyway:', err?.message);
  }
} else {
  console.error('⚠️ Database not reachable after retries — starting server anyway; it will recover once the DB is back.');
}
AssignmentSchedulerService.start();
WarrantyReminderScheduler.start();

// Backstop for the analytics ledger. Events are written when a warranty is
// registered; this closes any gap left by a failed write or a crash mid-request,
// so the trend chart cannot silently drift again.
startAnalyticsRepairSchedule();

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
    'https://server-bharat-maheshwaris-projects.vercel.app',
    'https://warranty2.autoformindia.co.in'
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
app.use('/api/admin/analytics', generalApiLimiter, analyticsRoutes);
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
app.use('/api/orders', generalApiLimiter, orderRoutes);

// Webhook routes (no rate limiting — Interakt needs reliable delivery)
app.use('/api/webhooks', webhookRoutes);

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

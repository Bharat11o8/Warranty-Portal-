import express from 'express';
import cors from 'cors';
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
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load .env from server directory
dotenv.config({ path: join(__dirname, '../.env') });
const app = express();
const PORT = process.env.PORT || 3000;
// ===========================================
// SECURITY MIDDLEWARE (Applied First)
// ===========================================
// Security headers (Helmet.js)
app.use(securityHeaders);
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
    : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        }
        else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Request-Id']
}));
// ===========================================
// BODY PARSERS
// ===========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// ===========================================
// HEALTH CHECK (No rate limiting)
// ===========================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Warranty Portal API is running',
        timestamp: new Date().toISOString()
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
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📧 Email service: ${process.env.EMAIL_SERVICE}`);
        console.log(`🗄️  Database: ${process.env.DB_NAME}`);
        console.log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`);
        console.log(`🔒 Security: Helmet.js enabled`);
        console.log(`⏱️  Rate limiting: Enabled`);
    });
}
export default app;

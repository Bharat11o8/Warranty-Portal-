import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import warrantyRoutes from './routes/warranty.routes.js';
import adminRoutes from './routes/admin.routes.js';
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load .env from server directory
dotenv.config({ path: join(__dirname, '../.env') });
const app = express();
const PORT = process.env.PORT || 3000;
// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});
// Manual CORS Pre-flight Handle (Backup)
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.sendStatus(200);
});
// Middleware
app.use(cors()); // Allow all origins (standard for public APIs)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(join(__dirname, '../uploads'))); // Disabled for Vercel
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Warranty Portal API is running' });
});
import publicRoutes from './routes/public.routes.js';
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
// Start server if not running in Vercel
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📧 Email service: ${process.env.EMAIL_SERVICE}`);
        console.log(`🗄️  Database: ${process.env.DB_NAME}`);
        console.log(`🌐 CORS origin: ${process.env.APP_URL}`);
    });
}
export default app;

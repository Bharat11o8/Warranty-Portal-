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

// Middleware
app.use(cors({
  origin: [
    process.env.APP_URL || "http://localhost:5173",
    "http://localhost:8080",
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Warranty Portal API is running' });
});

import publicRoutes from './routes/public.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_SERVICE}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
  console.log(`🌐 CORS origin: ${process.env.APP_URL}`);
});
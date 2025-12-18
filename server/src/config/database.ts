import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '../../.env') });

// Only log in development
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Database Configuration:');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  console.log('Port:', process.env.DB_PORT);
}

/**
 * Database Connection Pool
 * 
 * Configuration can be tuned via environment variables:
 * - DB_POOL_SIZE: Maximum number of connections (default: 10)
 * - DB_MAX_IDLE: Maximum idle connections (default: 5)
 * - DB_CONNECT_TIMEOUT: Connection timeout in ms (default: 60000)
 * - DB_IDLE_TIMEOUT: Idle connection timeout in ms (default: 60000)
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),

  // Connection Pool Settings (environment-configurable)
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10'),
  maxIdle: parseInt(process.env.DB_MAX_IDLE || '5'),
  queueLimit: 0,

  // Keep-Alive Settings
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // Send keep-alive after 10 seconds idle

  // Timeout Settings
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000'),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '60000'),
});

// Test connection on startup (only in development)
if (process.env.NODE_ENV !== 'production') {
  pool.getConnection()
    .then(conn => {
      console.log('✅ Database connection successful');
      conn.release();
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err.message);
    });
}

export default pool;
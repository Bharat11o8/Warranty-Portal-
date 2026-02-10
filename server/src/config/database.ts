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
  console.log('Timezone:', 'IST (+05:30)');
}

/**
 * Database Connection Pool
 * 
 * Configuration can be tuned via environment variables:
 * - DB_POOL_SIZE: Maximum number of connections (default: 10)
 * - DB_MAX_IDLE: Maximum idle connections (default: 5)
 * - DB_CONNECT_TIMEOUT: Connection timeout in ms (default: 10000)
 * - DB_IDLE_TIMEOUT: Idle connection timeout in ms (default: 60000)
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),

  // ✅ CRITICAL: Set timezone to IST (+05:30)
  // This ensures all date operations use IST
  timezone: '+05:30',

  // Connection Pool Settings (environment-configurable)
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_SIZE || '2'),
  maxIdle: parseInt(process.env.DB_MAX_IDLE || '5'),
  queueLimit: 0,

  // Keep-Alive Settings
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // Send keep-alive after 10 seconds idle

  // Timeout Settings
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '60000'),
});

const TRANSIENT_DB_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'EPIPE',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'PROTOCOL_ENQUEUE_AFTER_QUIT'
]);

let transientRetryCount = 0;
let lastTransientRetryAt: string | null = null;

export function isTransientDbError(error: any): boolean {
  const code = error?.code;
  return typeof code === 'string' && TRANSIENT_DB_ERROR_CODES.has(code);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWithRetry<T = any>(
  sql: string,
  params: any[] = [],
  options?: { retries?: number; baseDelayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 150;

  for (let attempt = 0; ; attempt++) {
    try {
      return await pool.execute(sql, params) as T;
    } catch (error: any) {
      const shouldRetry = isTransientDbError(error) && attempt < retries;
      if (!shouldRetry) {
        throw error;
      }

      transientRetryCount += 1;
      lastTransientRetryAt = new Date().toISOString();
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[DB] transient error "${error.code}" on attempt ${attempt + 1}. Retrying in ${delayMs}ms.`);
      await sleep(delayMs);
    }
  }
}

export function getDbRetryStats() {
  return {
    transientRetryCount,
    lastTransientRetryAt
  };
}

export async function pingDatabase(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// Set IST timezone on connection events (for underlying callback pool)
pool.pool.on('connection', (connection: any) => {
  connection.query("SET time_zone = '+05:30'");
});

// Test connection and log timezone info on startup
(async () => {
  try {
    const conn = await pool.getConnection();

    // Ensure timezone is set for this test connection
    await conn.query("SET time_zone = '+05:30'");

    if (process.env.NODE_ENV !== 'production') {
      const [rows]: any = await conn.query("SELECT NOW() as db_now, @@session.time_zone as session_tz, @@global.time_zone as global_tz");
      console.log('✅ Database connection successful');
      console.log('⏰ DB Now (IST):', rows[0].db_now);
      console.log('🌍 Session TZ:', rows[0].session_tz, '| Global TZ:', rows[0].global_tz);
    }

    conn.release();
  } catch (err: any) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

/**
 * Get current timestamp in IST (Indian Standard Time) as MySQL datetime string
 * Use this instead of NOW() in SQL queries to ensure correct timezone
 * 
 * @returns string in format 'YYYY-MM-DD HH:MM:SS'
 */
export function getISTTimestamp(): string {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset);

  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const hours = String(istTime.getUTCHours()).padStart(2, '0');
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get current date in IST as MySQL date string
 * 
 * @returns string in format 'YYYY-MM-DD'
 */
export function getISTDate(): string {
  return getISTTimestamp().split(' ')[0];
}

export default pool;


import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to point to server .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warranty_portal', // fallback just in case
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        console.log('Updating warranty status ENUM...');

        // Check pending_vendor
        const [columns] = await connection.execute("SHOW COLUMNS FROM warranty_registrations LIKE 'status'");
        const type = columns[0].Type;

        if (type.includes("'pending_vendor'")) {
            console.log('Status ENUM already contains pending_vendor. Skipping.');
        } else {
            await connection.execute(`
        ALTER TABLE warranty_registrations 
        MODIFY COLUMN status ENUM('pending', 'pending_vendor', 'validated', 'rejected') DEFAULT 'pending'
      `);
            console.log('Successfully updated status ENUM.');
        }
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();

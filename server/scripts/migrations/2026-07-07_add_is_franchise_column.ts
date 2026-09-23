import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrate() {
    console.log('🚀 Starting is_franchise column migration...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        const [columns]: any = await connection.query(`
            SHOW COLUMNS FROM vendor_details LIKE 'is_franchise'
        `);
        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE vendor_details 
                ADD COLUMN is_franchise BOOLEAN NOT NULL DEFAULT TRUE
            `);
            console.log('✅ Added is_franchise to vendor_details.');
        } else {
            console.log('ℹ️ is_franchise already exists in vendor_details.');
        }
        console.log('🎉 Database migration completed successfully!');
    } catch (error: any) {
        console.error('❌ Error executing database migration:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

migrate().catch(console.error);

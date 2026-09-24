import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrate() {
    console.log('🚀 Starting product_name column migration on pre_generated_uids...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        const [columns]: any = await connection.query(`
            SHOW COLUMNS FROM pre_generated_uids LIKE 'product_name'
        `);
        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE pre_generated_uids 
                ADD COLUMN product_name VARCHAR(255) DEFAULT NULL
            `);
            console.log('✅ Added product_name to pre_generated_uids.');
        } else {
            console.log('ℹ️ product_name already exists in pre_generated_uids.');
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

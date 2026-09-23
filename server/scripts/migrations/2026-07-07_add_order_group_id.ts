import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function addOrderGroupId() {
    console.log('🚀 Adding order_group_id to store_orders...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        const [columns]: any = await connection.query(`
            SHOW COLUMNS FROM store_orders LIKE 'order_group_id'
        `);
        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE store_orders
                ADD COLUMN order_group_id VARCHAR(36) NULL,
                ADD INDEX idx_order_group (order_group_id)
            `);
            console.log('✅ Added order_group_id to store_orders.');
        } else {
            console.log('ℹ️ order_group_id already exists in store_orders.');
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error: any) {
        console.error('❌ Error executing migration:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

addOrderGroupId().catch(console.error);

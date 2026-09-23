import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function makeDistributorInventoryVariationNullable() {
    console.log('🚀 Making distributor_inventory.variation_id nullable...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        await connection.query(`
            ALTER TABLE distributor_inventory
            MODIFY COLUMN variation_id VARCHAR(36) NULL
        `);
        console.log('✅ variation_id is now nullable. Products without variations can now have distributor stock tracked.');
    } catch (error: any) {
        console.error('❌ Error executing migration:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

makeDistributorInventoryVariationNullable().catch(console.error);

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function restoreWarrantyProducts() {
    console.log('🚑 Restoring 28 Warranty Products from backup...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // 1. Recreate the products table with correct schema
        console.log('📦 Creating products table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id varchar(36) NOT NULL PRIMARY KEY,
                name varchar(255) NOT NULL,
                type enum('seat_cover','ev_product') NOT NULL,
                warranty_years varchar(50) NOT NULL,
                created_at timestamp NULL DEFAULT current_timestamp(),
                updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Clear existing data (if any incomplete data exists)
        await connection.query('DELETE FROM products');

        // 3. Insert all 28 products from the backup
        console.log('📥 Inserting 28 products...');

        const products = [
            ['034dee16-e866-48dd-a3bf-4835814d3ad2', 'NAVIGATION PLUS', 'seat_cover', '2+1 year'],
            ['03d64269-2a3f-4f8a-adcc-9000027d0e30', 'EXCLUSIVE+', 'seat_cover', '2+1 year'],
            ['14da05c6-e888-48af-bf89-85fb5c534f91', 'X-CROSS', 'seat_cover', '2+1 year'],
            ['1da1c011-7a27-41be-a23c-9db7add14f03', 'D5', 'seat_cover', '1+1 year'],
            ['3984fc9f-b49b-496f-8453-d47239f2f17e', 'U-BLADE', 'seat_cover', '2+1 year'],
            ['5d3c07a3-7084-4457-b70c-b03d5ea62876', 'AMAZE+', 'seat_cover', '1+1 year'],
            ['635a56f5-6b09-4111-8fc2-f97cf11be060', 'U-Sports (Signature)', 'seat_cover', '2+1 year'],
            ['6bb979ab-b123-4c57-a303-4af11a8b18a4', 'AMAZE DUO +', 'seat_cover', '1+1 year'],
            ['6c626b25-9c39-4a75-bdb9-4dd88e2361ce', 'U-FOCUS', 'seat_cover', '1+1 year'],
            ['74a24ba3-ddc8-4462-8517-ece4c2638813', 'U- VOLT', 'seat_cover', '2+1 year'],
            ['77d05eee-b6af-4741-91d9-be3927db9a6a', 'U-Sports (Emporio)', 'seat_cover', '2+1 year'],
            ['7c43f53c-d572-406b-bf42-d7837d65bf3d', 'U-ARROW', 'seat_cover', '1+1 year'],
            ['8978b48d-e04a-4621-b6a6-1889e0ef9208', 'E1', 'seat_cover', '1+1 year'],
            ['910b3768-cd09-4176-9a0e-d291574bcdc2', 'Riviera (Series)', 'seat_cover', '1+1 year'],
            ['986c7e1a-71f5-40b7-b6ed-982287e3e270', 'E4', 'seat_cover', '1+1 year'],
            ['9c5458cc-3e8f-4d7d-a1a4-f6eb27b64ac1', 'Q2', 'seat_cover', '1+1 year'],
            ['a0dbf3d9-9afe-47e4-abe1-7bcd0a6a4f93', 'D3', 'seat_cover', '1+1 year'],
            ['c990a6b5-44dd-4f6d-992b-ab4ee7df38f4', 'U-IMPRESS', 'seat_cover', '1+1 year'],
            ['cae1eb98-5a5e-47d7-b508-ce94b091abff', 'U-Sports (Series)', 'seat_cover', '1+1 year'],
            ['ce8ae45c-893f-42d9-b986-ef61efa53068', 'E5', 'seat_cover', '1+1 year'],
            ['ce994853-b264-415d-ab21-acb938c6ac4c', 'U-HIGHWAY', 'seat_cover', '1+1 year'],
            ['d6ecb559-f114-497f-911c-a5528c43ae27', 'H-CROSS', 'seat_cover', '1+1 year'],
            ['d99ee636-25b5-44f6-a53c-f7d4e207c407', 'E2', 'seat_cover', '1+1 year'],
            ['e1578573-276d-4c1e-b11b-9c8caa4b56cd', 'U-LADDER', 'seat_cover', '2+1 year'],
            ['e4640dae-a7d5-4dfa-92ef-fe2430b33e70', 'POLO', 'seat_cover', '2+1 year'],
            ['f2270baf-6dbf-4f7b-951b-ff024f4c6432', 'H-GRAND', 'seat_cover', '2+1 year'],
            ['f4bf9437-e699-430f-99af-73959c23e436', 'EXCLUSIVE', 'seat_cover', '2+1 year'],
            ['fb785eaa-cbbb-4843-8ffc-49cce2db5904', 'Paint Protection Film', 'ev_product', '7 years']
        ];

        for (const p of products) {
            await connection.execute(
                'INSERT INTO products (id, name, type, warranty_years) VALUES (?, ?, ?, ?)',
                p
            );
        }

        console.log('✅ Successfully restored all 28 products!');

        // Verify
        const [result]: any = await connection.query('SELECT COUNT(*) as count FROM products');
        console.log(`📊 Verified: ${result[0].count} products in database.`);

    } catch (error: any) {
        console.error('❌ Restoration failed:', error.message);
        throw error;
    } finally {
        await connection.end();
        console.log('🏁 Done.');
    }
}

restoreWarrantyProducts().catch(console.error);

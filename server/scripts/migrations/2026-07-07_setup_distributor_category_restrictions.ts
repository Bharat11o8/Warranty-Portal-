import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function setupDistributorCategoryRestrictions() {
    console.log('🚀 Starting distributor category-restriction & multi-distributor schema setup...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // 1. distributor_allowed_categories — which categories a distributor may sell
        console.log('📦 Creating distributor_allowed_categories table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS distributor_allowed_categories (
                id VARCHAR(36) PRIMARY KEY,
                distributor_id VARCHAR(36) NOT NULL,
                category_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES store_categories(id) ON DELETE CASCADE,
                UNIQUE KEY uq_dist_category (distributor_id, category_id),
                INDEX idx_category (category_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. franchise_distributors — many-to-many franchise <-> distributor mapping
        console.log('📦 Creating franchise_distributors table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS franchise_distributors (
                id VARCHAR(36) PRIMARY KEY,
                franchise_user_id VARCHAR(36) NOT NULL,
                distributor_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (franchise_user_id) REFERENCES profiles(id) ON DELETE CASCADE,
                FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE CASCADE,
                UNIQUE KEY uq_franchise_dist (franchise_user_id, distributor_id),
                INDEX idx_franchise (franchise_user_id),
                INDEX idx_distributor (distributor_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Backfill franchise_distributors from the existing single-FK mapping
        console.log('🔄 Backfilling franchise_distributors from vendor_details.distributor_id...');
        const [existingMappings]: any = await connection.query(`
            SELECT vd.user_id as franchise_user_id, vd.distributor_id
            FROM vendor_details vd
            WHERE vd.is_franchise = TRUE AND vd.distributor_id IS NOT NULL
        `);

        let backfilled = 0;
        for (const mapping of existingMappings) {
            const [result]: any = await connection.query(
                `INSERT INTO franchise_distributors (id, franchise_user_id, distributor_id)
                 VALUES (UUID(), ?, ?)
                 ON DUPLICATE KEY UPDATE id = id`,
                [mapping.franchise_user_id, mapping.distributor_id]
            );
            if (result.affectedRows > 0) backfilled++;
        }
        console.log(`✅ Backfilled ${backfilled} franchise-distributor mappings (out of ${existingMappings.length} existing single mappings).`);

        // 4. Backfill distributor_allowed_categories from existing distributor_inventory
        //    (today's data has no category restriction, so we grant access to every
        //    category a distributor currently stocks at least one product in)
        console.log('🔄 Backfilling distributor_allowed_categories from distributor_inventory...');
        const [existingStockCategories]: any = await connection.query(`
            SELECT DISTINCT di.distributor_id, sp.category_id
            FROM distributor_inventory di
            JOIN store_products sp ON di.product_id = sp.id
            WHERE sp.category_id IS NOT NULL
        `);

        let categoriesBackfilled = 0;
        for (const row of existingStockCategories) {
            const [result]: any = await connection.query(
                `INSERT INTO distributor_allowed_categories (id, distributor_id, category_id)
                 VALUES (UUID(), ?, ?)
                 ON DUPLICATE KEY UPDATE id = id`,
                [row.distributor_id, row.category_id]
            );
            if (result.affectedRows > 0) categoriesBackfilled++;
        }
        console.log(`✅ Backfilled ${categoriesBackfilled} distributor-category allowances (out of ${existingStockCategories.length} distinct distributor/category pairs found in current inventory).`);

        console.log('🎉 Distributor category-restriction schema setup completed successfully!');
        console.log('ℹ️  vendor_details.distributor_id was left untouched for backward compatibility with the existing single-distributor order flow.');
    } catch (error: any) {
        console.error('❌ Error executing schema setup:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

setupDistributorCategoryRestrictions().catch(console.error);

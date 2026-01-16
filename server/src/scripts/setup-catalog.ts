import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function setupCatalogSchema() {
    console.log('🚀 Starting Catalog Schema setup...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306,
        multipleStatements: true
    });

    try {
        console.log('📊 Creating catalog_categories table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS catalog_categories (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                image VARCHAR(255),
                parent_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES catalog_categories(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('📦 Creating catalog_products table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS catalog_products (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price JSON NOT NULL,
                description JSON NOT NULL,
                images JSON NOT NULL,
                category_id VARCHAR(50),
                additional_info JSON,
                in_stock BOOLEAN DEFAULT TRUE,
                rating DECIMAL(3,2) DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES catalog_categories(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Catalog tables created successfully');

    } catch (error: any) {
        console.error('❌ Error during migration:', error.message);
        throw error;
    } finally {
        await connection.end();
        console.log('🏁 Migration completed');
    }
}

setupCatalogSchema().catch(console.error);

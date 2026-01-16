import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function setupCatalogSchema() {
    console.log('Starting catalog schema setup...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // 0. RESET: Drop existing tables to ensure clean schema (Order matters due to FKs)
        console.log('🗑️ Dropping existing tables to ensure fresh schema...');
        await connection.query('DROP TABLE IF EXISTS store_reviews');
        await connection.query('DROP TABLE IF EXISTS store_product_images');
        await connection.query('DROP TABLE IF EXISTS store_product_variations');
        await connection.query('DROP TABLE IF EXISTS store_products');
        await connection.query('DROP TABLE IF EXISTS store_categories');
        console.log('✅ Tables dropped.');

        // 1. Categories Table
        console.log('Creating/Updating store_categories table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS store_categories (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                image VARCHAR(500),
                parent_id VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES store_categories(id) ON DELETE SET NULL,
                INDEX idx_parent (parent_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Products Table
        console.log('Creating/Updating store_products table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS store_products (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description LONGTEXT,
                price DECIMAL(10, 2) DEFAULT 0.00,
                category_id VARCHAR(36),
                in_stock BOOLEAN DEFAULT TRUE,
                additional_info JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES store_categories(id) ON DELETE SET NULL,
                INDEX idx_category (category_id),
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Product Variations Table (New!)
        console.log('Creating/Updating store_product_variations table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS store_product_variations (
                id VARCHAR(36) PRIMARY KEY,
                product_id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(100),
                price DECIMAL(10, 2) NOT NULL,
                stock_quantity INT DEFAULT 0,
                attributes JSON,
                meta JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE,
                INDEX idx_product (product_id),
                INDEX idx_sku (sku)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Product Images Table (Updated for Smart Gallery)
        console.log('Creating/Updating store_product_images table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS store_product_images (
                id VARCHAR(36) PRIMARY KEY,
                product_id VARCHAR(36) NOT NULL,
                variation_id VARCHAR(36) DEFAULT NULL,
                url VARCHAR(500) NOT NULL,
                display_order INT DEFAULT 0,
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE,
                FOREIGN KEY (variation_id) REFERENCES store_product_variations(id) ON DELETE CASCADE,
                INDEX idx_product_images (product_id),
                INDEX idx_variation_images (variation_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Reviews Table
        console.log('Creating/Updating store_reviews table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS store_reviews (
                id VARCHAR(36) PRIMARY KEY,
                product_id VARCHAR(36) NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE,
                INDEX idx_product_reviews (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Catalog schema setup completed successfully!');

    } catch (error: any) {
        console.error('❌ Error creating catalog schema:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

setupCatalogSchema().catch(console.error);

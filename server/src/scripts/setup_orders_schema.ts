import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function setupOrdersSchema() {
    if (!process.argv.includes('--confirm')) {
        console.error('❌ Refusing to run: this DROPS store_order_items, store_orders, and distributor_inventory before recreating them — all live orders and stock would be lost.');
        console.error('   This script was for the original one-time setup; running it again against a live DB is destructive.');
        console.error('   Re-run with --confirm if you are certain this is what you want: npx tsx setup_orders_schema.ts --confirm');
        process.exit(1);
    }

    console.log('🚀 Starting B2B ordering and inventory schema setup...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // 0. Drop existing tables if they exist (clean setup)
        console.log('🗑️ Dropping existing B2B tables for clean schema...');
        await connection.query('DROP TABLE IF EXISTS store_order_items');
        await connection.query('DROP TABLE IF EXISTS store_orders');
        await connection.query('DROP TABLE IF EXISTS distributor_inventory');
        console.log('✅ Temporary tables dropped.');

        // 1. Create distributors table
        console.log('📦 Creating distributors table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS distributors (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Modify vendor_details table to add distributor_id
        console.log('⚙️ Altering vendor_details to map to a distributor...');
        // Check if distributor_id already exists to prevent duplication error
        const [columns]: any = await connection.query(`
            SHOW COLUMNS FROM vendor_details LIKE 'distributor_id'
        `);
        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE vendor_details 
                ADD COLUMN distributor_id VARCHAR(36) NULL,
                ADD CONSTRAINT fk_vendor_distributor 
                FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE SET NULL
            `);
            console.log('✅ Altered vendor_details successfully.');
        } else {
            console.log('ℹ️ distributor_id already exists in vendor_details.');
        }

        // 3. Create distributor_inventory table
        console.log('📊 Creating distributor_inventory table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS distributor_inventory (
                id VARCHAR(36) PRIMARY KEY,
                distributor_id VARCHAR(36) NOT NULL,
                product_id VARCHAR(36) NOT NULL,
                variation_id VARCHAR(36) NOT NULL,
                stock_quantity INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE,
                FOREIGN KEY (variation_id) REFERENCES store_product_variations(id) ON DELETE CASCADE,
                UNIQUE KEY uq_dist_prod_var (distributor_id, product_id, variation_id),
                INDEX idx_distributor (distributor_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Create store_orders table
        console.log('🧾 Creating store_orders table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS store_orders (
                id VARCHAR(36) PRIMARY KEY,
                vendor_id VARCHAR(36) NOT NULL,
                distributor_id VARCHAR(36) NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                shipping_address TEXT NOT NULL,
                shipping_city VARCHAR(100) NOT NULL,
                shipping_state VARCHAR(100) NOT NULL,
                shipping_pincode VARCHAR(20) NOT NULL,
                additional_remarks TEXT DEFAULT NULL,
                distributor_confirmation_note TEXT DEFAULT NULL,
                pdf_url VARCHAR(500) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vendor_id) REFERENCES profiles(id) ON DELETE CASCADE,
                FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE CASCADE,
                INDEX idx_vendor (vendor_id),
                INDEX idx_distributor (distributor_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Create store_order_items table
        console.log('🍕 Creating store_order_items table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS store_order_items (
                id VARCHAR(36) PRIMARY KEY,
                order_id VARCHAR(36) NOT NULL,
                product_id VARCHAR(36) DEFAULT NULL,
                variation_id VARCHAR(36) DEFAULT NULL,
                product_name VARCHAR(255) NOT NULL,
                variation_name VARCHAR(255) DEFAULT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                needs_customization BOOLEAN DEFAULT FALSE,
                customization_remarks TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE SET NULL,
                FOREIGN KEY (variation_id) REFERENCES store_product_variations(id) ON DELETE SET NULL,
                INDEX idx_order (order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Tables created successfully. Starting seeding...');

        // 6. Seed mock distributors
        const dists = [
            {
                id: uuidv4(),
                name: 'Delhi Auto-Distributors',
                email: 'delhi_dist@example.com',
                phone_number: '9876543210',
                address: 'Plot 42, Mayapuri Industrial Area Phase 1',
                city: 'New Delhi',
                state: 'Delhi',
                pincode: '110064'
            },
            {
                id: uuidv4(),
                name: 'Mumbai Premium Parts',
                email: 'mumbai_dist@example.com',
                phone_number: '9876543211',
                address: 'Chamber 808, Linking Road, Santacruz West',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400054'
            },
            {
                id: uuidv4(),
                name: 'Noida Supply Chain Ltd',
                email: 'noida_dist@example.com',
                phone_number: '9876543212',
                address: 'B-12, Sector 63',
                city: 'Noida',
                state: 'Uttar Pradesh',
                pincode: '201301'
            }
        ];

        for (const dist of dists) {
            await connection.query(`
                INSERT INTO distributors (id, name, email, phone_number, address, city, state, pincode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [dist.id, dist.name, dist.email, dist.phone_number, dist.address, dist.city, dist.state, dist.pincode]);
        }
        console.log(`✅ Seeded ${dists.length} distributors.`);

        // 7. Map existing franchises (vendors) to seeded distributors
        const [vendors]: any = await connection.query('SELECT id FROM vendor_details');
        console.log(`Found ${vendors.length} vendors in database.`);

        if (vendors.length > 0) {
            for (let i = 0; i < vendors.length; i++) {
                // Rotate assignments across the 3 distributors
                const distId = dists[i % dists.length].id;
                await connection.query(`
                    UPDATE vendor_details SET distributor_id = ? WHERE id = ?
                `, [distId, vendors[i].id]);
            }
            console.log('✅ Mapped all existing vendors to a distributor.');
        }

        // 8. Seed live inventory counts for every product variation and distributor
        const [variations]: any = await connection.query(`
            SELECT id, product_id FROM store_product_variations
        `);
        console.log(`Found ${variations.length} product variations in database.`);

        if (variations.length > 0) {
            let seedCount = 0;
            for (const dist of dists) {
                for (const pv of variations) {
                    // Seed random stock between 10 and 100 units
                    const stock = Math.floor(Math.random() * 91) + 10;
                    await connection.query(`
                        INSERT INTO distributor_inventory (id, distributor_id, product_id, variation_id, stock_quantity)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity)
                    `, [uuidv4(), dist.id, pv.product_id, pv.id, stock]);
                    seedCount++;
                }
            }
            console.log(`✅ Seeded ${seedCount} inventory entries in distributor_inventory.`);
        } else {
            console.log('⚠️ No product variations found in the database. Please setup the catalog and seed products first.');
        }

        console.log('🎉 B2B Schema setup and seeding completed successfully!');

    } catch (error: any) {
        console.error('❌ Error initializing B2B schema:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

setupOrdersSchema().catch(console.error);

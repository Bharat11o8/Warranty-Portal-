const mysql = require('mysql2/promise');
require('dotenv').config();

async function createWarrantyTable() {
    console.log('Starting warranty_registrations table creation/update...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        // Create warranty_registrations table
        console.log('Creating warranty_registrations table...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS warranty_registrations (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                product_type VARCHAR(100) NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(20) NOT NULL,
                customer_address TEXT NOT NULL,
                car_make VARCHAR(100) NOT NULL,
                car_model VARCHAR(100) NOT NULL,
                car_year VARCHAR(4) NOT NULL,
                registration_number VARCHAR(50) NOT NULL,
                purchase_date DATE NOT NULL,
                installer_name VARCHAR(255),
                installer_contact VARCHAR(255),
                product_details JSON NOT NULL,
                manpower_id VARCHAR(36) DEFAULT NULL,
                status ENUM('pending', 'validated', 'rejected') DEFAULT 'pending',
                rejection_reason TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_product_type (product_type),
                INDEX idx_status (status),
                INDEX idx_manpower_id (manpower_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ warranty_registrations table created successfully');

        // Add store_email column to vendor_details
        console.log('\nChecking vendor_details table...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'vendor_details' 
            AND COLUMN_NAME = 'store_email'
        `, [process.env.DB_NAME]);

        if (columns.length === 0) {
            console.log('Adding store_email column to vendor_details...');
            await connection.query(`
                ALTER TABLE vendor_details 
                ADD COLUMN store_email VARCHAR(255) AFTER store_name
            `);
            console.log('✅ Added store_email column');
        } else {
            console.log('ℹ️  store_email column already exists');
        }

        // Verify the table structure
        const [tableColumns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'warranty_registrations'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME]);

        console.log('\n📋 warranty_registrations table structure:');
        tableColumns.forEach((col) => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
        console.log('\n✅ Migration completed successfully!');
    }
}

createWarrantyTable().catch(console.error);

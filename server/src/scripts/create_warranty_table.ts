import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

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
        // Drop and recreate the table to ensure all columns exist
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

        // Verify the table structure
        const [columns]: any = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'warranty_registrations'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME]);

        console.log('\n📋 Table structure:');
        columns.forEach((col: any) => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
        console.log('\n✅ Migration completed');
    }
}

createWarrantyTable().catch(console.error);

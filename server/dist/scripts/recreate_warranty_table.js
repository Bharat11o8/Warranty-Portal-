import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
async function recreateWarrantyTable() {
    console.log('🔍 Checking and recreating warranty_registrations table...\n');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });
    try {
        // First, check what columns currently exist
        console.log('📋 Current table structure:');
        try {
            const [columns] = await connection.query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'warranty_registrations'
                ORDER BY ORDINAL_POSITION
            `, [process.env.DB_NAME]);
            if (columns.length > 0) {
                columns.forEach((col) => {
                    console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
                });
            }
            else {
                console.log('  Table does not exist');
            }
        }
        catch (err) {
            console.log('  Table does not exist');
        }
        // Drop the existing table
        console.log('\n🗑️  Dropping existing warranty_registrations table...');
        await connection.query('DROP TABLE IF EXISTS warranty_registrations');
        console.log('✅ Table dropped');
        // Create the table with correct structure
        console.log('\n📦 Creating new warranty_registrations table...');
        await connection.query(`
            CREATE TABLE warranty_registrations (
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
        console.log('✅ Table created successfully');
        // Verify the new structure
        console.log('\n📋 New table structure:');
        const [newColumns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'warranty_registrations'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME]);
        newColumns.forEach((col) => {
            console.log(`  ✓ ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        console.log('\n✅ warranty_registrations table recreated successfully!');
        console.log('🎉 You can now submit warranty forms without errors.');
    }
    catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    }
    finally {
        await connection.end();
    }
}
recreateWarrantyTable().catch(console.error);

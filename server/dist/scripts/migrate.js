import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
// Load environment variables from server root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
async function migrate() {
    console.log('Connecting to database with host:', process.env.DB_HOST);
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });
    console.log('Connected to database...');
    try {
        // 1. Update user_roles ENUM to include 'admin'
        console.log('Updating user_roles ENUM...');
        try {
            await connection.query("ALTER TABLE user_roles MODIFY COLUMN role ENUM('customer', 'vendor', 'admin') NOT NULL");
            console.log('✅ user_roles updated');
        }
        catch (error) {
            console.log('⚠️  Could not update user_roles (might already be updated):', error.message);
        }
        // 2. Create vendor_details table
        console.log('Creating vendor_details table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS vendor_details (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        store_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        state VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
        UNIQUE KEY unique_vendor_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log('✅ vendor_details table created');
        // 3. Create manpower table
        console.log('Creating manpower table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS manpower (
        id VARCHAR(36) PRIMARY KEY,
        vendor_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        manpower_id VARCHAR(50) NOT NULL,
        applicator_type ENUM('seat_cover', 'ppf_spf', 'ev') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendor_details(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log('✅ manpower table created');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
    }
    finally {
        await connection.end();
    }
}
migrate();

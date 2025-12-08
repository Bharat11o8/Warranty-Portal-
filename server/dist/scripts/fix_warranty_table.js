import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
async function checkAndFixWarrantyTable() {
    console.log('Checking warranty_registrations table structure...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });
    try {
        // Check current columns
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'warranty_registrations'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME]);
        console.log('\n📋 Current columns:');
        const columnNames = columns.map((col) => col.COLUMN_NAME);
        columnNames.forEach((name) => console.log(`  - ${name}`));
        // Check if product_type exists
        if (!columnNames.includes('product_type')) {
            console.log('\n⚠️  product_type column is missing! Adding it...');
            await connection.query(`
                ALTER TABLE warranty_registrations 
                ADD COLUMN product_type VARCHAR(100) NOT NULL AFTER user_id
            `);
            console.log('✅ Added product_type column');
        }
        else {
            console.log('\n✅ product_type column already exists');
        }
        // Check other required columns and add if missing
        const requiredColumns = {
            'manpower_id': 'VARCHAR(36) DEFAULT NULL',
            'status': "ENUM('pending', 'validated', 'rejected') DEFAULT 'pending'",
            'rejection_reason': 'TEXT DEFAULT NULL'
        };
        for (const [colName, colDef] of Object.entries(requiredColumns)) {
            if (!columnNames.includes(colName)) {
                console.log(`\n⚠️  ${colName} column is missing! Adding it...`);
                await connection.query(`
                    ALTER TABLE warranty_registrations 
                    ADD COLUMN ${colName} ${colDef}
                `);
                console.log(`✅ Added ${colName} column`);
            }
        }
        // Show final structure
        const [finalColumns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'warranty_registrations'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME]);
        console.log('\n📋 Final table structure:');
        finalColumns.forEach((col) => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
    finally {
        await connection.end();
        console.log('\n✅ Check completed');
    }
}
checkAndFixWarrantyTable().catch(console.error);

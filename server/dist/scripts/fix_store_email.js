import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
async function checkAndFixStoreEmail() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'warranty_system'
    });
    try {
        console.log('🔍 Checking store_email column...');
        // Check if column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'vendor_details' 
            AND COLUMN_NAME = 'store_email'
        `, [process.env.DB_NAME || 'warranty_system']);
        if (columns.length === 0) {
            console.log('❌ store_email column does NOT exist. Adding it...');
            await connection.execute(`
                ALTER TABLE vendor_details 
                ADD COLUMN store_email VARCHAR(255) AFTER store_name
            `);
            console.log('✅ Added store_email column');
        }
        else {
            console.log('✅ store_email column exists');
        }
        // Check current data
        console.log('\n📊 Checking current vendor_details data...');
        const [vendors] = await connection.execute(`
            SELECT vd.id, vd.store_name, vd.store_email, p.email 
            FROM vendor_details vd
            JOIN profiles p ON vd.user_id = p.id
        `);
        console.log(`Found ${vendors.length} vendor records`);
        let nullCount = 0;
        vendors.forEach((v) => {
            if (!v.store_email) {
                nullCount++;
                console.log(`  - ${v.store_name}: store_email is NULL (profile email: ${v.email})`);
            }
            else {
                console.log(`  - ${v.store_name}: store_email = ${v.store_email}`);
            }
        });
        if (nullCount > 0) {
            console.log(`\n⚠️  Found ${nullCount} vendors with NULL store_email`);
            console.log('🔧 Updating store_email from profile email...');
            await connection.execute(`
                UPDATE vendor_details vd
                JOIN profiles p ON vd.user_id = p.id
                SET vd.store_email = p.email
                WHERE vd.store_email IS NULL OR vd.store_email = ''
            `);
            console.log('✅ Updated vendor records');
            // Verify the update
            const [updated] = await connection.execute(`
                SELECT vd.id, vd.store_name, vd.store_email 
                FROM vendor_details vd
            `);
            console.log('\n📊 After update:');
            updated.forEach((v) => {
                console.log(`  - ${v.store_name}: store_email = ${v.store_email}`);
            });
        }
        else {
            console.log('\n✅ All vendors have store_email populated');
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await connection.end();
    }
}
checkAndFixStoreEmail();

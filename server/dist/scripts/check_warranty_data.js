import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
async function checkWarrantyData() {
    console.log('🔍 Checking warranty_registrations data...\n');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });
    try {
        // Check total count
        const [countResult] = await connection.query('SELECT COUNT(*) as total FROM warranty_registrations');
        console.log(`📊 Total warranties in database: ${countResult[0].total}\n`);
        if (countResult[0].total > 0) {
            // Get all warranties
            const [warranties] = await connection.query(`
                SELECT 
                    id,
                    user_id,
                    product_type,
                    customer_name,
                    customer_email,
                    status,
                    created_at
                FROM warranty_registrations 
                ORDER BY created_at DESC
                LIMIT 10
            `);
            console.log('📋 Recent warranties:');
            warranties.forEach((w, index) => {
                console.log(`\n${index + 1}. Warranty ID: ${w.id}`);
                console.log(`   User ID: ${w.user_id}`);
                console.log(`   Product Type: ${w.product_type}`);
                console.log(`   Customer: ${w.customer_name} (${w.customer_email})`);
                console.log(`   Status: ${w.status}`);
                console.log(`   Created: ${w.created_at}`);
            });
            // Check user_id mapping
            console.log('\n\n🔍 Checking user details:');
            const [users] = await connection.query(`
                SELECT DISTINCT 
                    p.id,
                    p.name,
                    p.email,
                    ur.role
                FROM warranty_registrations wr
                JOIN profiles p ON wr.user_id = p.id
                LEFT JOIN user_roles ur ON p.id = ur.user_id
                LIMIT 10
            `);
            users.forEach((u) => {
                console.log(`\n- User: ${u.name} (${u.email})`);
                console.log(`  ID: ${u.id}`);
                console.log(`  Role: ${u.role || 'N/A'}`);
            });
        }
        else {
            console.log('⚠️  No warranties found in database!');
            console.log('   Make sure you submitted a warranty form successfully.');
        }
    }
    catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    }
    finally {
        await connection.end();
    }
}
checkWarrantyData().catch(console.error);

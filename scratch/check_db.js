const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function checkAVSMotors() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        console.log('Searching for AVS Motors in vendor_details...');
        const [vendors] = await connection.execute(
            'SELECT id, user_id, store_name FROM vendor_details WHERE store_name LIKE ?',
            ['%AVS motors%']
        );

        if (vendors.length === 0) {
            console.log('No vendor found matching "AVS motors"');
            return;
        }

        for (const vendor of vendors) {
            console.log(`\nFound Vendor: ${vendor.store_name} (ID: ${vendor.id}, UserID: ${vendor.user_id})`);

            // Check warranties by installer_name
            const [warrantiesByName] = await connection.execute(
                'SELECT COUNT(*) as count FROM warranty_registrations WHERE installer_name = ?',
                [vendor.store_name]
            );
            console.log(`Warranties by installer_name ("${vendor.store_name}"): ${warrantiesByName[0].count}`);

            // Check warranties by user_id
            const [warrantiesByUserId] = await connection.execute(
                'SELECT COUNT(*) as count FROM warranty_registrations WHERE user_id = ?',
                [vendor.user_id]
            );
            console.log(`Warranties by user_id (${vendor.user_id}): ${warrantiesByUserId[0].count}`);

            // Check warranties by manpower_id
            const [manpower] = await connection.execute(
                'SELECT id FROM manpower WHERE vendor_id = ?',
                [vendor.id]
            );
            const manpowerIds = manpower.map(m => m.id);
            
            if (manpowerIds.length > 0) {
                const [warrantiesByManpower] = await connection.execute(
                    `SELECT COUNT(*) as count FROM warranty_registrations WHERE manpower_id IN (${manpowerIds.map(() => '?').join(',')})`,
                    manpowerIds
                );
                console.log(`Warranties by Manpower IDs (${manpowerIds.join(', ')}): ${warrantiesByManpower[0].count}`);
            } else {
                console.log('No manpower found for this vendor.');
            }
        }

    } catch (error) {
        console.error('Database query error:', error);
    } finally {
        await connection.end();
    }
}

checkAVSMotors();

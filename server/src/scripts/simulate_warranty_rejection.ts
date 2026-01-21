import db from '../config/database.js';

async function simulateWarrantyRejection() {
    console.log('--- Simulating Warranty Rejection Notification ---');
    try {
        // Get a vendor user to send the notification to
        const [vendorUsers]: any = await db.execute(`
            SELECT p.id, p.name FROM profiles p 
            JOIN user_roles ur ON p.id = ur.user_id 
            WHERE ur.role = 'vendor' LIMIT 1
        `);

        if (vendorUsers.length === 0) {
            console.log('No vendor users found! Creating for admin instead...');
            const [admins]: any = await db.execute(`SELECT id, name FROM profiles LIMIT 1`);
            if (admins.length === 0) {
                console.log('No users found at all!');
                return;
            }
            vendorUsers.push(admins[0]);
        }

        const targetUser = vendorUsers[0];
        console.log(`Sending to user: ${targetUser.name} (ID: ${targetUser.id})`);

        // Create a warranty rejection notification with CORRECT type
        const [result]: any = await db.execute(
            `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
            [
                targetUser.id,
                'Warranty Rejected ✗',
                'The warranty for Test Customer (TEST123456) was rejected. Reason: Verification Test',
                'warranty',  // <-- This is the KEY: type is 'warranty', not 'alert'
                '/dashboard/vendor'
            ]
        );
        console.log(`✅ Created warranty rejection notification with ID: ${result.insertId}`);
        console.log(`   Type: warranty (should appear in "Warranty Alerts" tab)`);

        // Verify
        const [check]: any = await db.execute(`SELECT id, title, type FROM notifications WHERE id = ?`, [result.insertId]);
        console.log(`\nVerification: [${check[0].id}] [TYPE: ${check[0].type}] ${check[0].title}`);
        console.log('\n✅ Please refresh your dashboard and check the "Warranty Alerts" tab!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

simulateWarrantyRejection();

import db from '../config/database.js';

async function debugNotifications() {
    console.log('--- Debug: Checking Latest Notifications ---');
    try {
        // Check last 10 notifications
        const [notifs]: any = await db.execute(`
            SELECT n.id, n.user_id, n.title, n.type, n.created_at, p.name as user_name 
            FROM notifications n
            LEFT JOIN profiles p ON n.user_id = p.id
            ORDER BY n.created_at DESC LIMIT 10
        `);
        console.log(`Found ${notifs.length} notifications:\n`);
        notifs.forEach((r: any) => {
            console.log(`[${r.id}] [${r.type}] User: ${r.user_name || r.user_id}`);
            console.log(`    Title: ${r.title}`);
            console.log(`    Created: ${r.created_at}`);
            console.log('');
        });

        // Check the logged-in user's notifications
        const [vendorUser]: any = await db.execute(`
            SELECT p.id, p.name FROM profiles p
            JOIN user_roles ur ON p.id = ur.user_id
            WHERE ur.role = 'vendor' LIMIT 1
        `);
        if (vendorUser.length > 0) {
            console.log(`\n--- Notifications for vendor: ${vendorUser[0].name} (${vendorUser[0].id}) ---`);
            const [vendorNotifs]: any = await db.execute(`
                SELECT id, title, type, is_read FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
            `, [vendorUser[0].id]);
            vendorNotifs.forEach((r: any) => console.log(`  [${r.id}] [${r.type}] ${r.title} (read: ${r.is_read})`));
        }

        // Check latest warranty registrations
        console.log(`\n--- Latest Warranty Registrations ---`);
        const [warranties]: any = await db.execute(`
            SELECT uid, customer_name, manpower_id, status, created_at FROM warranty_registrations ORDER BY created_at DESC LIMIT 3
        `);
        warranties.forEach((w: any) => console.log(`  [${w.uid}] ${w.customer_name} | Manpower: ${w.manpower_id} | Status: ${w.status}`));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

debugNotifications();

import db from '../config/database.js';

async function checkWarrantyNotifs() {
    console.log('--- Checking Warranty Notifications ---');
    try {
        // Get all warranty type notifications
        const [warrantyNotifs]: any = await db.execute(`
            SELECT id, user_id, title, type, is_read FROM notifications WHERE type = 'warranty' ORDER BY created_at DESC LIMIT 20
        `);
        console.log(`Found ${warrantyNotifs.length} warranty notifications:`);
        warrantyNotifs.forEach((r: any) => console.log(`  [${r.id}] User:${r.user_id} | ${r.title} | Read:${r.is_read}`));

        // Get all alert type notifications to see if they still exist there
        const [alertNotifs]: any = await db.execute(`
            SELECT id, user_id, title, type FROM notifications WHERE type = 'alert' ORDER BY created_at DESC LIMIT 10
        `);
        console.log(`\nFound ${alertNotifs.length} alert notifications:`);
        alertNotifs.forEach((r: any) => console.log(`  [${r.id}] User:${r.user_id} | ${r.title}`));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkWarrantyNotifs();

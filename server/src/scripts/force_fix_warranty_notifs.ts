import db from '../config/database.js';

async function forceFixAllWarrantyNotifications() {
    console.log('--- Force Fixing ALL Warranty Notifications ---');
    try {
        // Step 1: Update ALL notifications with "Warranty" in the title to type 'warranty'
        const [result1]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE title LIKE '%Warranty%' AND type != 'warranty'
        `);
        console.log(`✓ Updated ${result1.affectedRows} notifications with 'Warranty' in title.`);

        // Step 2: Update ALL notifications with "Warranty" in the message to type 'warranty'
        const [result2]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE message LIKE '%warranty%' AND type != 'warranty'
        `);
        console.log(`✓ Updated ${result2.affectedRows} notifications with 'warranty' in message.`);

        // Step 3: Show all current warranty notifications
        const [rows]: any = await db.execute(`
            SELECT id, title, type FROM notifications WHERE title LIKE '%Warranty%' ORDER BY created_at DESC LIMIT 10
        `);
        console.log('\n--- Latest Warranty Notifications ---');
        rows.forEach((r: any) => console.log(`[${r.id}] [${r.type}] ${r.title}`));

        console.log('\n✅ All warranty notifications should now be in the "Warranty Alerts" category.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

forceFixAllWarrantyNotifications();

import db from '../config/database.js';

async function diagnoseNotifications() {
    console.log('--- Diagnosing Notifications ---');
    try {
        // Check total count
        const [countResult]: any = await db.execute('SELECT COUNT(*) as total FROM notifications');
        console.log(`Total notifications in database: ${countResult[0].total}`);

        // Check counts by type
        const [typeCounts]: any = await db.execute(`
            SELECT type, COUNT(*) as count FROM notifications GROUP BY type
        `);
        console.log('\nNotifications by type:');
        typeCounts.forEach((r: any) => console.log(`  ${r.type}: ${r.count}`));

        // Show last 10 notifications
        const [latest]: any = await db.execute(`
            SELECT id, user_id, title, type, created_at FROM notifications ORDER BY created_at DESC LIMIT 10
        `);
        console.log('\n--- Latest 10 Notifications ---');
        latest.forEach((r: any) => console.log(`[${r.id}] [${r.type}] [User: ${r.user_id}] ${r.title} (${r.created_at})`));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

diagnoseNotifications();

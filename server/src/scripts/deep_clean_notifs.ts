import db from '../config/database.js';

async function deepCleanNotifications() {
    console.log('=== DEEP NOTIFICATION CLEANUP ===\n');

    try {
        // Step 1: Fix ALL warranty-related notifications to have type 'warranty'
        console.log('--- Step 1: Fix notification types ---');
        const [fixResult]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE (
                title LIKE '%Warranty%' 
                OR title LIKE '%warranty%' 
                OR message LIKE '%warranty%' 
                OR message LIKE '%Warranty%'
            )
        `);
        console.log(`✅ Fixed type for ${fixResult.affectedRows} warranty-related notifications`);

        // Step 2: Delete exact duplicates (keep oldest)
        console.log('\n--- Step 2: Remove exact duplicates ---');

        // First, find duplicates
        const [duplicates]: any = await db.execute(`
            SELECT user_id, title, message, MIN(id) as keep_id, GROUP_CONCAT(id) as all_ids, COUNT(*) as cnt
            FROM notifications
            GROUP BY user_id, title, message
            HAVING cnt > 1
        `);

        let totalDeleted = 0;
        for (const dup of duplicates) {
            const allIds = dup.all_ids.split(',').map((id: string) => parseInt(id));
            const idsToDelete = allIds.filter((id: number) => id !== dup.keep_id);

            if (idsToDelete.length > 0) {
                const [delResult]: any = await db.execute(
                    `DELETE FROM notifications WHERE id IN (${idsToDelete.join(',')})`
                );
                totalDeleted += delResult.affectedRows;
                console.log(`  Removed ${idsToDelete.length} duplicates of "${dup.title.substring(0, 40)}..."`);
            }
        }
        console.log(`✅ Total duplicates removed: ${totalDeleted}`);

        // Step 3: Show final state
        console.log('\n--- Final State ---');
        const [typeStats]: any = await db.execute(`
            SELECT type, COUNT(*) as count FROM notifications GROUP BY type ORDER BY count DESC
        `);
        console.log('Notifications by type:');
        typeStats.forEach((r: any) => console.log(`  ${r.type}: ${r.count}`));

        const [total]: any = await db.execute('SELECT COUNT(*) as cnt FROM notifications');
        console.log(`\nTotal notifications: ${total[0].cnt}`);

        console.log('\n✅ Deep cleanup complete!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

deepCleanNotifications();

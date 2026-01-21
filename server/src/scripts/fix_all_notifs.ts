import db from '../config/database.js';

async function fixAllNotificationIssues() {
    console.log('=== FIXING ALL NOTIFICATION ISSUES ===\n');

    try {
        // 1. Fix ALL warranty-related notifications to have type 'warranty'
        console.log('--- Step 1: Fix notification types ---');
        const [typeResult]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE (title LIKE '%Warranty%' OR title LIKE '%warranty%' OR message LIKE '%warranty%' OR message LIKE '%Warranty%')
            AND type != 'warranty'
        `);
        console.log(`✅ Updated ${typeResult.affectedRows} notifications to type 'warranty'`);

        // 2. Remove exact duplicates (same user, same title, same message)
        console.log('\n--- Step 2: Remove duplicate notifications ---');
        const [duplicates]: any = await db.execute(`
            SELECT MIN(id) as keep_id, user_id, title, message, COUNT(*) as count 
            FROM notifications 
            GROUP BY user_id, title, message 
            HAVING count > 1
        `);

        if (duplicates.length > 0) {
            for (const dup of duplicates) {
                const [deleteResult]: any = await db.execute(`
                    DELETE FROM notifications 
                    WHERE user_id = ? AND title = ? AND message = ? AND id != ?
                `, [dup.user_id, dup.title, dup.message, dup.keep_id]);
                console.log(`  Removed ${deleteResult.affectedRows} duplicates of "${dup.title}"`);
            }
        } else {
            console.log('  No duplicates found');
        }

        // 3. Verify the fix
        console.log('\n--- Verification ---');
        const [typeStats]: any = await db.execute(`
            SELECT type, COUNT(*) as count FROM notifications GROUP BY type ORDER BY count DESC
        `);
        console.log('Notifications by type:');
        typeStats.forEach((r: any) => console.log(`  ${r.type}: ${r.count}`));

        console.log('\n✅ All fixes applied successfully!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

fixAllNotificationIssues();

import db from '../config/database.js';

async function fixNotifications() {
    console.log('--- Starting Notification Cleanup (JS) ---');

    try {
        // 1. Update miscategorized warranty notifications
        const [updateResult] = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE (title LIKE '%Warranty%' OR message LIKE '%Warranty%') 
            AND type = 'product'
        `);
        console.log(`✓ Updated ${updateResult.affectedRows} notifications to 'warranty' type.`);

        // 2. Identify and remove duplicates
        // We look for notifications with the same user_id, title, message, and created_at
        const [duplicates] = await db.execute(`
            SELECT user_id, title, message, created_at, COUNT(*) as count
            FROM notifications
            GROUP BY user_id, title, message, created_at
            HAVING count > 1
        `);

        if (duplicates.length > 0) {
            console.log(`! Found ${duplicates.length} sets of duplicate notifications.`);

            for (const dup of duplicates) {
                // Find all IDs for this specific set of parameters
                const [allRows] = await db.execute(`
                    SELECT id FROM notifications 
                    WHERE user_id = ? AND title = ? AND message = ? AND created_at = ?
                    ORDER BY id DESC
                `, [dup.user_id, dup.title, dup.message, dup.created_at]);

                if (allRows.length > 1) {
                    // Keep the latest one (index 0), delete the rest
                    const idsToDelete = allRows.slice(1).map(row => row.id);
                    await db.execute(`
                        DELETE FROM notifications 
                        WHERE id IN (${idsToDelete.join(',')})
                    `);
                    console.log(`  - Deleted ${idsToDelete.length} duplicate(s) for user ${dup.user_id}`);
                }
            }
        } else {
            console.log('✓ No exact duplicates found (user_id, title, message, created_at).');
        }

        // 3. Near-duplicate check (within 10 seconds)
        // This handles cases where sequential broadcasts might have slightly staggered timestamps
        const [nearDuplicates] = await db.execute(`
            SELECT n1.id as id_to_delete
            FROM notifications n1
            JOIN notifications n2 ON n1.user_id = n2.user_id 
                AND n1.title = n2.title 
                AND n1.message = n2.message 
                AND n1.id < n2.id
                AND ABS(TIMESTAMPDIFF(SECOND, n1.created_at, n2.created_at)) < 10
        `);

        if (nearDuplicates.length > 0) {
            const idsToDelete = [...new Set(nearDuplicates.map(row => row.id_to_delete))];
            await db.execute(`
                DELETE FROM notifications 
                WHERE id IN (${idsToDelete.join(',')})
            `);
            console.log(`✓ Deleted ${idsToDelete.length} near-duplicate notifications (sent within 10s).`);
        }

        console.log('--- Cleanup Finished ---');
    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        process.exit(0);
    }
}

fixNotifications();

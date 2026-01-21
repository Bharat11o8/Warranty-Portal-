import db from '../config/database.js';

async function fixNotifications() {
    console.log('--- Starting Notification Cleanup ---');

    try {
        // 1. Update miscategorized warranty notifications
        const [updateResult]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE (title LIKE '%Warranty%' OR message LIKE '%Warranty%') 
            AND type = 'product'
        `);
        console.log(`✓ Updated ${updateResult.affectedRows} notifications to 'warranty' type.`);

        // 2. Identify and remove duplicates
        // We keep the notification with the highest ID (latest one) for each set of duplicates
        const [duplicates]: any = await db.execute(`
            SELECT MIN(id) as id_to_delete, user_id, title, message, created_at
            FROM notifications
            GROUP BY user_id, title, message, created_at
            HAVING COUNT(*) > 1
        `);

        if (duplicates.length > 0) {
            console.log(`! Found ${duplicates.length} sets of duplicate notifications.`);

            for (const dup of duplicates) {
                // Find all but the latest one to delete
                const [toDelete]: any = await db.execute(`
                    SELECT id FROM notifications 
                    WHERE user_id = ? AND title = ? AND message = ? AND created_at = ?
                    ORDER BY id DESC
                `, [dup.user_id, dup.title, dup.message, dup.created_at]);

                if (toDelete.length > 1) {
                    const idsToDelete = toDelete.slice(1).map((row: any) => row.id);
                    await db.execute(`
                        DELETE FROM notifications 
                        WHERE id IN (${idsToDelete.join(',')})
                    `);
                    console.log(`  - Deleted ${idsToDelete.length} duplicate(s) for user ${dup.user_id}`);
                }
            }
        } else {
            console.log('✓ No duplicates found based on full matching (user_id, title, message, created_at).');
        }

        // 3. More aggressive duplicate check (if timestamps are slightly different but message is same)
        // Check for duplicates within 5 seconds of each other
        const [nearDuplicates]: any = await db.execute(`
            SELECT n1.id as id1, n2.id as id2
            FROM notifications n1
            JOIN notifications n2 ON n1.user_id = n2.user_id 
                AND n1.title = n2.title 
                AND n1.message = n2.message 
                AND n1.id < n2.id
                AND ABS(TIMESTAMPDIFF(SECOND, n1.created_at, n2.created_at)) < 5
        `);

        if (nearDuplicates.length > 0) {
            const idsToDelete = nearDuplicates.map((row: any) => row.id1);
            await db.execute(`
                DELETE FROM notifications 
                WHERE id IN (${idsToDelete.join(',')})
            `);
            console.log(`✓ Deleted ${idsToDelete.length} near-duplicate notifications (sent within 5s).`);
        }

        console.log('--- Cleanup Finished ---');
    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        process.exit(0);
    }
}

fixNotifications();

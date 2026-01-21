import db from '../config/database.js';

async function inspectAndFix() {
    console.log('--- Comprehensive Notification Inspection ---');

    try {
        // 1. List all notifications with type 'product' to see what they are
        const [products]: any = await db.execute("SELECT id, title, message, type FROM notifications WHERE type = 'product'");
        console.log(`Found ${products.length} notifications with type 'product':`);
        products.forEach((n: any) => console.log(`  [${n.id}] ${n.title}`));

        // 2. Identify all warranty-related that ARE NOT 'warranty' type
        const [miscategorized]: any = await db.execute(`
            SELECT id, title FROM notifications 
            WHERE (title LIKE '%Warranty%' OR message LIKE '%Warranty%' OR title LIKE '%Staff%' OR title LIKE '%Grievance%')
            AND type != 'warranty'
        `);
        if (miscategorized.length > 0) {
            const ids = miscategorized.map((n: any) => n.id);
            await db.execute(`UPDATE notifications SET type = 'warranty' WHERE id IN (${ids.join(',')})`);
            console.log(`✓ Forced 'warranty' type on ${miscategorized.length} notifications.`);
        }

        // 3. Aggressive Duplicate Removal
        // Any notification for the same user with the same title and same message within 1 hour is considered a duplicate
        const [duplicates]: any = await db.execute(`
            SELECT n1.id as to_keep, n2.id as to_delete
            FROM notifications n1
            JOIN notifications n2 ON n1.user_id = n2.user_id 
                AND n1.title = n2.title 
                AND n1.message = n2.message 
                AND n1.id > n2.id
                AND ABS(TIMESTAMPDIFF(MINUTE, n1.created_at, n2.created_at)) < 60
        `);

        if (duplicates.length > 0) {
            const idsToDelete = [...new Set(duplicates.map((row: any) => row.to_delete))];
            await db.execute(`DELETE FROM notifications WHERE id IN (${idsToDelete.join(',')})`);
            console.log(`✓ Deleted ${idsToDelete.length} duplicates based on 1-hour proximity.`);
        }

        console.log('--- Inspection Finished ---');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

inspectAndFix();

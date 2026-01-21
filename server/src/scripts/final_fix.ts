import db from '../config/database.js';

async function finalFix() {
    console.log('=== FINAL COMPREHENSIVE FIX ===\n');

    try {
        // Step 1: Force ALL warranty-related notifications to type 'warranty'
        console.log('--- Step 1: Force warranty type ---');
        const [warResult]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE title LIKE '%Warranty%' 
               OR title LIKE '%warranty%' 
               OR message LIKE '%warranty%' 
               OR message LIKE '%Warranty%'
               OR title LIKE '%Approved by Vendor%'
               OR title LIKE '%Rejected%'
        `);
        console.log(`Updated ${warResult.affectedRows} notifications to 'warranty' type`);

        // Step 2: Remove ANY remaining duplicates
        console.log('\n--- Step 2: Remove duplicates ---');
        const [duplicates]: any = await db.execute(`
            SELECT user_id, title, MIN(id) as keep_id, COUNT(*) as cnt
            FROM notifications
            GROUP BY user_id, title
            HAVING cnt > 1
        `);

        for (const dup of duplicates) {
            await db.execute(
                `DELETE FROM notifications WHERE user_id = ? AND title = ? AND id != ?`,
                [dup.user_id, dup.title, dup.keep_id]
            );
            console.log(`  Kept only one "${dup.title.substring(0, 30)}..." for user ${dup.user_id}`);
        }

        // Step 3: Show final state
        console.log('\n--- Final State ---');
        const [all]: any = await db.execute(`
            SELECT id, user_id, title, type FROM notifications ORDER BY created_at DESC
        `);
        all.forEach((r: any) => console.log(`[${r.id}] [${r.type}] User:${r.user_id} | ${r.title}`));

        const [stats]: any = await db.execute(`SELECT type, COUNT(*) as cnt FROM notifications GROUP BY type`);
        console.log('\nSummary by type:');
        stats.forEach((s: any) => console.log(`  ${s.type}: ${s.cnt}`));

        console.log('\n✅ FINAL FIX COMPLETE!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

finalFix();

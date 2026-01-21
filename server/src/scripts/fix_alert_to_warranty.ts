import db from '../config/database.js';

async function fixAlertToWarranty() {
    console.log('=== FIX ALERT -> WARRANTY ===\n');
    try {
        // Show all notifications with their types
        console.log('--- Current State ---');
        const [all]: any = await db.execute(`SELECT id, title, type FROM notifications ORDER BY created_at DESC`);
        all.forEach((r: any) => console.log(`[${r.id}] TYPE="${r.type}" | ${r.title}`));

        // Update ALL notifications that contain 'Warranty' or 'Rejected' to type 'warranty'
        console.log('\n--- Fixing ---');
        const [result]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE (title LIKE '%Warranty%' OR title LIKE '%Rejected%' OR title LIKE '%Approved%')
            AND type != 'warranty'
        `);
        console.log(`Updated ${result.affectedRows} notifications to 'warranty' type`);

        // Show final state
        console.log('\n--- Final State ---');
        const [final]: any = await db.execute(`SELECT id, title, type FROM notifications ORDER BY created_at DESC`);
        final.forEach((r: any) => console.log(`[${r.id}] TYPE="${r.type}" | ${r.title}`));

        const [stats]: any = await db.execute(`SELECT type, COUNT(*) as cnt FROM notifications GROUP BY type`);
        console.log('\nCounts:');
        stats.forEach((s: any) => console.log(`  ${s.type}: ${s.cnt}`));

    } catch (e) { console.error(e); }
    finally { process.exit(0); }
}
fixAlertToWarranty();

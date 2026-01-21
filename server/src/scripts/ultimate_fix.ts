import db from '../config/database.js';

async function ultimateFix() {
    console.log('=== ULTIMATE FIX ===\n');
    try {
        // Step 1: Fix ALL warranty-related notifications to 'warranty'
        await db.execute(`UPDATE notifications SET type = 'warranty' WHERE title LIKE '%Warranty%'`);
        await db.execute(`UPDATE notifications SET type = 'warranty' WHERE title LIKE '%Rejected%'`);
        await db.execute(`UPDATE notifications SET type = 'warranty' WHERE title LIKE '%Approved%'`);
        await db.execute(`UPDATE notifications SET type = 'warranty' WHERE message LIKE '%warranty%'`);
        console.log('✅ Fixed warranty types');

        // Step 2: Show final state
        const [all]: any = await db.execute(`SELECT id, title, type FROM notifications ORDER BY id DESC`);
        console.log('\nFinal state:');
        all.forEach((r: any) => console.log(`[${r.id}] [${r.type || 'EMPTY'}] ${r.title}`));

    } catch (e) { console.error(e); }
    finally { process.exit(0); }
}
ultimateFix();

import db from '../config/database.js';

async function aggressiveFix() {
    console.log('=== AGGRESSIVE FIX ===\n');

    try {
        // First, see what we have with empty types
        console.log('--- Notifications with empty/null type ---');
        const [empty]: any = await db.execute(`
            SELECT id, user_id, title, type, message FROM notifications 
            WHERE type IS NULL OR type = '' OR type = 'null' OR LENGTH(TRIM(type)) = 0
        `);
        empty.forEach((r: any) => {
            console.log(`[${r.id}] "${r.title}" | MSG: "${r.message?.substring(0, 50)}..."`);
        });

        if (empty.length > 0) {
            // Force update all of them to 'warranty' if they contain warranty keywords
            console.log('\n--- Fixing empty types ---');
            for (const n of empty) {
                const hasWarrantyKeyword = (n.title + ' ' + n.message).toLowerCase().includes('warranty') ||
                    (n.title + ' ' + n.message).toLowerCase().includes('approved') ||
                    (n.title + ' ' + n.message).toLowerCase().includes('rejected') ||
                    (n.title + ' ' + n.message).toLowerCase().includes('registration');

                const newType = hasWarrantyKeyword ? 'warranty' : 'system';
                await db.execute('UPDATE notifications SET type = ? WHERE id = ?', [newType, n.id]);
                console.log(`  [${n.id}] -> ${newType}`);
            }
        }

        // Final verification
        console.log('\n--- FINAL STATE ---');
        const [all]: any = await db.execute(`SELECT id, title, type FROM notifications ORDER BY id DESC`);
        all.forEach((r: any) => console.log(`[${r.id}] [${r.type || 'EMPTY'}] ${r.title}`));

        const [stats]: any = await db.execute(`SELECT type, COUNT(*) as cnt FROM notifications GROUP BY type`);
        console.log('\nBy type:');
        stats.forEach((s: any) => console.log(`  ${s.type || 'EMPTY'}: ${s.cnt}`));

        console.log('\n✅ DONE!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

aggressiveFix();

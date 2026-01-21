import db from '../config/database.js';

async function forceFixEmpty() {
    console.log('=== FORCE FIX EMPTY ===\n');
    try {
        // Force ALL empty string types to 'warranty'
        const [result]: any = await db.execute(`UPDATE notifications SET type = 'warranty' WHERE type = ''`);
        console.log(`Updated ${result.affectedRows} notifications with empty type to 'warranty'`);

        // Verify
        const [stats]: any = await db.execute(`SELECT IFNULL(NULLIF(type, ''), 'EMPTY') as t, COUNT(*) as cnt FROM notifications GROUP BY type`);
        console.log('\nFinal counts:');
        stats.forEach((s: any) => console.log(`  ${s.t}: ${s.cnt}`));
    } catch (e) { console.error(e); }
    finally { process.exit(0); }
}
forceFixEmpty();

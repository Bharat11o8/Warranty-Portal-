import db from '../config/database.js';

async function verify() {
    console.log('=== VERIFICATION ===\n');
    try {
        const [all]: any = await db.execute(`SELECT id, title, type FROM notifications ORDER BY id`);
        console.log('ALL NOTIFICATIONS:');
        all.forEach((r: any) => console.log(`[${r.id}] TYPE="${r.type}" | ${r.title}`));

        const [stats]: any = await db.execute(`SELECT IFNULL(type, 'NULL') as t, COUNT(*) as cnt FROM notifications GROUP BY type`);
        console.log('\nCOUNTS:');
        stats.forEach((s: any) => console.log(`  ${s.t}: ${s.cnt}`));
    } catch (e) { console.error(e); }
    finally { process.exit(0); }
}
verify();

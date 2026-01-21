import db from '../config/database.js';

async function robustFix() {
    console.log('=== ROBUST FIX WITH COMMIT ===\n');
    const conn = await (db as any).getConnection();
    try {
        await conn.beginTransaction();

        // Update empty types
        const [result]: any = await conn.execute(`UPDATE notifications SET type = 'warranty' WHERE type = '' OR type IS NULL`);
        console.log(`Updated ${result.affectedRows} rows`);

        await conn.commit();
        console.log('Committed!');

        // Verify with fresh query
        const [all]: any = await conn.execute(`SELECT id, title, type FROM notifications`);
        console.log('\nAll notifications:');
        all.forEach((r: any) => console.log(`[${r.id}] TYPE="${r.type}" | ${r.title}`));

    } catch (e) {
        await conn.rollback();
        console.error('Error:', e);
    } finally {
        conn.release();
        process.exit(0);
    }
}
robustFix();

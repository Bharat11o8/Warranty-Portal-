import db from '../config/database.js';

async function run() {
    const connection = await db.getConnection();
    try {
        console.log('Backfilling profile_id for distributors where it is NULL...');

        // Find distributors without a profile_id but whose email matches a profile
        const [rows]: any = await connection.execute(
            `SELECT d.id as dist_id, d.email, p.id as profile_id
             FROM distributors d
             JOIN profiles p ON p.email = d.email
             WHERE d.profile_id IS NULL`
        );

        console.log(`Found ${rows.length} distributors needing backfill.`);

        for (const row of rows) {
            await connection.execute(
                `UPDATE distributors SET profile_id = ? WHERE id = ?`,
                [row.profile_id, row.dist_id]
            );
            console.log(`  ✓ Linked distributor ${row.dist_id} (${row.email}) → profile ${row.profile_id}`);
        }

        // Also verify: show remaining NULLs
        const [remaining]: any = await connection.execute(
            `SELECT id, email FROM distributors WHERE profile_id IS NULL`
        );
        if (remaining.length > 0) {
            console.log(`\n⚠️  ${remaining.length} distributors still have no profile_id (no matching profile email):`);
            remaining.forEach((r: any) => console.log(`  - ${r.id} (${r.email})`));
        } else {
            console.log('\n✅ All distributors now have a profile_id.');
        }
    } catch (err) {
        console.error('Backfill failed:', err);
        throw err;
    } finally {
        connection.release();
        process.exit(0);
    }
}

run();

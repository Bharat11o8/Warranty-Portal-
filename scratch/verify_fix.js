import mysql from 'mysql2/promise';

async function verify() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: 'u823909847_warr',
        password: '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    });

    try {
        console.log('--- Verifying Schema Fixes ---');
        const [cols] = await db.execute('DESCRIBE warranty_registrations');
        console.table(cols.slice(0, 5));

        const idCol = cols.find(c => c.Field === 'id');
        const uidCol = cols.find(c => c.Field === 'uid');

        if (idCol && idCol.Key === 'PRI' && idCol.Extra === 'auto_increment') {
            console.log('✓ ID is correctly set as AUTO_INCREMENT PRIMARY KEY');
        } else {
            console.error('✗ ID is NOT correctly set!', idCol);
        }

        const [indexes] = await db.execute('SHOW INDEX FROM warranty_registrations WHERE Key_name = "idx_unique_uid"');
        if (indexes.length > 0) {
            console.log('✓ UNIQUE index idx_unique_uid exists');
        } else {
            console.error('✗ UNIQUE index idx_unique_uid is MISSING!');
        }

        console.log('\n--- Verifying Data Integrity ---');
        const [blanksResult] = await db.execute('SELECT COUNT(*) as count FROM warranty_registrations WHERE id = "" OR id IS NULL');
        const blanksCount = blanksResult[0].count;
        console.log(`Blank IDs count: ${blanksCount}`);

        const [dupIds] = await db.execute('SELECT id, COUNT(*) as count FROM warranty_registrations GROUP BY id HAVING count > 1');
        console.log('Duplicate IDs found:', dupIds.length);

        const [dupUids] = await db.execute('SELECT uid, COUNT(*) as count FROM warranty_registrations GROUP BY uid HAVING count > 1');
        console.log('Duplicate UIDs found:', dupUids.length);

        if (blanksCount === 0 && dupIds.length === 0 && dupUids.length === 0) {
            console.log('✓ Data integrity verified successfully!');
        } else {
            console.error('✗ Data integrity issues still exist!');
        }

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await db.end();
    }
}

verify();

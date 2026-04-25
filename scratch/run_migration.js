import mysql from 'mysql2/promise';

async function migrate() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: 'u823909847_warr',
        password: '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    });

    try {
        console.log('--- Starting Migration Step 1: Assigning Unique IDs ---');
        
        // Fetch all rows with blank ID
        const [rows] = await db.execute('SELECT uid FROM warranty_registrations WHERE id = ""');
        console.log(`Found ${rows.length} rows with blank IDs.`);

        for (let i = 0; i < rows.length; i++) {
            const nextId = i + 1;
            const uid = rows[i].uid;
            console.log(`Updating UID ${uid} to ID ${nextId}`);
            await db.execute('UPDATE warranty_registrations SET id = ? WHERE uid = ? AND id = "" LIMIT 1', [nextId.toString(), uid]);
        }

        console.log('--- Migration Step 2: Altering Table Schema ---');
        
        // 1. First, make sure 'id' has no NULLs (redundant but safe)
        await db.execute('UPDATE warranty_registrations SET id = "999" WHERE id IS NULL');

        // 2. Add Primary Key constraint to 'id'
        // Need to change type first to INT
        await db.execute('ALTER TABLE warranty_registrations MODIFY id INT NOT NULL');
        await db.execute('ALTER TABLE warranty_registrations ADD PRIMARY KEY (id)');
        await db.execute('ALTER TABLE warranty_registrations MODIFY id INT NOT NULL AUTO_INCREMENT');
        
        console.log('✓ Successfully set id as AUTO_INCREMENT PRIMARY KEY');

        // 3. Add UNIQUE constraint to 'uid'
        console.log('--- Migration Step 3: Adding UNIQUE Constraint to uid ---');
        
        // Check for duplicate UIDs one last time
        const [duplicates] = await db.execute('SELECT uid, COUNT(*) as count FROM warranty_registrations GROUP BY uid HAVING count > 1');
        if (duplicates.length > 0) {
            console.error('CRITICAL: Duplicate UIDs found, cannot add UNIQUE constraint!', duplicates);
        } else {
            await db.execute('ALTER TABLE warranty_registrations ADD UNIQUE INDEX idx_unique_uid (uid)');
            console.log('✓ Successfully added UNIQUE index to uid');
        }

        console.log('--- Migration Complete ---');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await db.end();
    }
}

migrate();

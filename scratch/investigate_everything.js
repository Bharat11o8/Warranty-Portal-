import mysql from 'mysql2/promise';

async function investigate() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: 'u823909847_warr',
        password: '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    });

    try {
        const uids = [
            '25100402380610', '25102302384412', '26030202421275', '25081602368091',
            '26031602424705', '26031602424404', '25122902403812', '26010302405294',
            '26021602417718', '26031902425824', '261480004540587', '26041302432606',
            '26010802406519', '25122302402392', '26032502427391', '26041302432620'
        ];

        const [tables] = await db.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        for (const tableName of tableNames) {
            if (tableName === 'admin_activity_log') continue; // Too big/noisy maybe
            
            console.log(`Checking table: ${tableName}`);
            const [cols] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
            const colNames = cols.map(c => c.Field);

            for (const col of colNames) {
                // Search for UID in any column that might have it
                try {
                    const [matches] = await db.query(
                        `SELECT * FROM ${tableName} WHERE \`${col}\` IN (?)`,
                        [uids]
                    );

                    if (matches.length > 0) {
                        console.log(`!!! FOUND ${matches.length} matches in ${tableName}.${col}`);
                        console.log('Match samples:', JSON.stringify(matches[0], null, 2));
                    }
                } catch (e) {
                    // console.error(`Error searching ${tableName}.${col}:`, e.message);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.end();
    }
}

investigate();

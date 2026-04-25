import mysql from 'mysql2/promise';

async function deepSearch() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: 'u823909847_warr',
        password: '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    });

    try {
        const searchTerm = 'UP15BW9080';
        console.log(`Searching for: ${searchTerm}`);

        const [tables] = await db.query('SHOW TABLES');
        const tNames = tables.map(t => Object.values(t)[0]);

        for (const t of tNames) {
            if (t === 'admin_activity_log') continue;
            
            const [cols] = await db.query(`SHOW COLUMNS FROM ${t}`);
            for (const c of cols) {
                try {
                    const [rows] = await db.query(
                        `SELECT * FROM ${t} WHERE \`${c.Field}\` LIKE ?`,
                        [`%${searchTerm}%`]
                    );
                    if (rows.length > 0) {
                        console.log(`!!! MATCH in ${t}.${c.Field} (${rows.length} rows)`);
                    }
                } catch (e) {
                    // console.error(`Error in ${t}.${c.Field}:`, e.message);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.end();
    }
}

deepSearch();

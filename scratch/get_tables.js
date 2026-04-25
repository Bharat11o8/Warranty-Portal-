import mysql from 'mysql2/promise';

async function getTables() {
    const db = await mysql.createConnection({
        host: 'srv839.hstgr.io',
        user: 'u823909847_warr',
        password: '@V+S&7Fc?f3V',
        database: 'u823909847_warranty'
    });

    try {
        const [rows] = await db.execute('SHOW TABLES');
        const tables = rows.map(r => Object.values(r)[0]);
        console.log('Tables:', tables.join('\n'));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.end();
    }
}

getTables();

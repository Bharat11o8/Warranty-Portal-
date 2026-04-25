import mysql from 'mysql2/promise';

async function checkNotifications() {
    try {
        const db = await mysql.createConnection({
            host: 'srv839.hstgr.io',
            user: 'u823909847_warr',
            password: '@V+S&7Fc?f3V',
            database: 'u823909847_warranty'
        });

        console.log('--- Checking Warranty Notifications for Recovery Data ---');
        // Look for notifications that might contain registration numbers or other details
        const [rows] = await db.execute(`
            SELECT id, user_id, title, message, created_at 
            FROM notifications 
            WHERE title LIKE "%Warranty%" OR message LIKE "%Registration%"
            ORDER BY created_at DESC 
            LIMIT 100
        `);
        
        console.table(rows);

        await db.end();
    } catch (err) {
        console.error(err);
    }
}

checkNotifications();

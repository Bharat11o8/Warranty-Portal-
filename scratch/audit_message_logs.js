import mysql from 'mysql2/promise';

async function checkLogs() {
    try {
        const db = await mysql.createConnection({
            host: 'srv839.hstgr.io',
            user: 'u823909847_warr',
            password: '@V+S&7Fc?f3V',
            database: 'u823909847_warranty'
        });

        console.log('--- Auditing message_logs for Car Details ---');
        // The WhatsApp service sends [name, uid, product, car]
        // We want to see if these body values were logged or if we can see them in context
        const [rows] = await db.execute(`
            SELECT id, context, reference_id, created_at 
            FROM message_logs 
            WHERE template_name = 'warranty_confirmed' OR context = 'warranty_confirm'
            ORDER BY created_at DESC 
            LIMIT 50
        `);
        
        console.table(rows);

        await db.end();
    } catch (err) {
        console.error(err);
    }
}

checkLogs();

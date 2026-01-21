import db from '../config/database.js';

async function checkLastNotifications() {
    console.log('--- Checking Last 5 Notifications ---');
    try {
        const [rows]: any = await db.execute('SELECT id, title, message, type, created_at FROM notifications ORDER BY created_at DESC LIMIT 5');
        rows.forEach((n: any) => {
            console.log(`[${n.id}] [${n.type}] TITLE: "${n.title}"`);
            console.log(`      MESSAGE: "${n.message}"`);
            console.log(`      CREATED: ${n.created_at}`);
            console.log('-------------------');
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkLastNotifications();

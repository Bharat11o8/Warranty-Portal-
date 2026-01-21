import db from '../config/database.js';

async function directFix() {
    console.log('--- Direct Fix: Changing alert to warranty ---');
    try {
        // Update ALL alert notifications that contain 'Warranty' or 'warranty' to type 'warranty'
        const [result]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE (title LIKE '%Warranty%' OR title LIKE '%warranty%' OR message LIKE '%Warranty%' OR message LIKE '%warranty%')
        `);
        console.log(`✅ Updated ${result.affectedRows} notifications to 'warranty' type.`);

        // Verify the fix
        const [check]: any = await db.execute(`SELECT id, title, type FROM notifications ORDER BY created_at DESC LIMIT 10`);
        console.log('\n--- Latest 10 Notifications After Fix ---');
        check.forEach((r: any) => console.log(`[${r.id}] [${r.type}] ${r.title}`));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

directFix();

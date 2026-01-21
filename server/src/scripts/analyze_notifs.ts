import db from '../config/database.js';

async function analyzeNotificationIssues() {
    console.log('=== NOTIFICATION ANALYSIS ===\n');

    try {
        // 1. Check all notifications grouped by type
        console.log('--- Notifications by Type ---');
        const [typeStats]: any = await db.execute(`
            SELECT type, COUNT(*) as count FROM notifications GROUP BY type ORDER BY count DESC
        `);
        typeStats.forEach((r: any) => console.log(`  ${r.type}: ${r.count}`));

        // 2. Check for duplicates (same user, same title, same message)
        console.log('\n--- Potential Duplicates ---');
        const [duplicates]: any = await db.execute(`
            SELECT user_id, title, message, COUNT(*) as count 
            FROM notifications 
            GROUP BY user_id, title, message 
            HAVING count > 1
            ORDER BY count DESC
            LIMIT 10
        `);
        if (duplicates.length === 0) {
            console.log('  No duplicates found');
        } else {
            duplicates.forEach((r: any) => console.log(`  [${r.count}x] User ${r.user_id}: "${r.title}"`));
        }

        // 3. Check warranty-related notifications that are NOT type 'warranty'
        console.log('\n--- Warranty notifications with WRONG type ---');
        const [wrongType]: any = await db.execute(`
            SELECT id, title, type FROM notifications 
            WHERE (title LIKE '%Warranty%' OR message LIKE '%warranty%') 
            AND type != 'warranty'
            ORDER BY created_at DESC
            LIMIT 10
        `);
        if (wrongType.length === 0) {
            console.log('  All warranty notifications have correct type');
        } else {
            wrongType.forEach((r: any) => console.log(`  [${r.id}] [${r.type}] ${r.title}`));
        }

        // 4. Show latest 10 notifications with full details
        console.log('\n--- Latest 10 Notifications ---');
        const [latest]: any = await db.execute(`
            SELECT id, user_id, title, type, created_at FROM notifications ORDER BY created_at DESC LIMIT 10
        `);
        latest.forEach((r: any) => console.log(`  [${r.id}] [${r.type}] User:${r.user_id} | ${r.title}`));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

analyzeNotificationIssues();

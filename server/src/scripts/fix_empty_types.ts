import db from '../config/database.js';

async function fixEmptyTypes() {
    console.log('=== FIX EMPTY NOTIFICATION TYPES ===\n');

    try {
        // Show current state
        console.log('--- Current State ---');
        const [current]: any = await db.execute(`
            SELECT id, title, type, message FROM notifications ORDER BY created_at DESC
        `);
        current.forEach((r: any) => {
            console.log(`[${r.id}] [TYPE: "${r.type || 'EMPTY'}"] ${r.title}`);
        });

        // Fix empty types - determine correct type based on content
        console.log('\n--- Fixing Empty Types ---');

        // Set warranty type for any notification with warranty-related content
        const [warResult]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'warranty' 
            WHERE (type IS NULL OR type = '' OR type = 'null')
            AND (title LIKE '%Warranty%' OR title LIKE '%warranty%' OR message LIKE '%warranty%' OR message LIKE '%Warranty%')
        `);
        console.log(`Fixed ${warResult.affectedRows} warranty-related notifications`);

        // Set system type for remaining empty notifications
        const [sysResult]: any = await db.execute(`
            UPDATE notifications 
            SET type = 'system' 
            WHERE type IS NULL OR type = '' OR type = 'null'
        `);
        console.log(`Set ${sysResult.affectedRows} remaining notifications to 'system'`);

        // Show final state
        console.log('\n--- Final State ---');
        const [final]: any = await db.execute(`
            SELECT type, COUNT(*) as count FROM notifications GROUP BY type ORDER BY count DESC
        `);
        final.forEach((r: any) => console.log(`  ${r.type}: ${r.count}`));

        console.log('\n✅ Empty types fixed!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

fixEmptyTypes();

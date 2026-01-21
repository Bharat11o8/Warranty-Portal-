import db from '../config/database.js';

async function createTestWarrantyNotification() {
    console.log('--- Creating Test Warranty Notification ---');
    try {
        // Get the first user to send a test notification to
        const [users]: any = await db.execute('SELECT id FROM profiles LIMIT 1');
        if (users.length === 0) {
            console.log('No users found!');
            return;
        }
        const userId = users[0].id;

        // Insert a test warranty notification
        const [result]: any = await db.execute(
            `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
            [userId, 'Test Warranty Notification ✓', 'This is a test warranty notification to verify the category.', 'warranty', '/dashboard/vendor']
        );
        console.log(`✅ Created test notification with ID: ${result.insertId}`);

        // Verify
        const [check]: any = await db.execute(`SELECT id, title, type FROM notifications WHERE id = ?`, [result.insertId]);
        console.log(`Verification: [${check[0].id}] [${check[0].type}] ${check[0].title}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

createTestWarrantyNotification();

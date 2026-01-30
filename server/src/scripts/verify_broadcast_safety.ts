import db from '../config/database.js';
import { NotificationService } from '../services/notification.service.js';

async function run() {
    try {
        console.log('--- Verifying Broadcast Safety ---');

        // Test 1: No Role (Should be caught by safety check)
        console.log('\nTest 1: Broadcast with NO role (Expect Warning)');
        const res1 = await NotificationService.broadcast({
            title: 'Safety Test 1',
            message: 'This should not be sent',
            type: 'system'
        });
        console.log('Result 1:', JSON.stringify(res1));

        // Test 2: Admin Role (Should succeed)
        console.log('\nTest 2: Broadcast to ADMIN (Expect Success)');
        const res2 = await NotificationService.broadcast({
            title: 'Safety Test 2',
            message: 'This is a test admin broadcast',
            type: 'system',
            targetRole: 'admin'
        });
        console.log('Result 2:', JSON.stringify(res2));

        console.log('\nVerification Complete.');
    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        setTimeout(() => process.exit(), 1000);
    }
}

run();

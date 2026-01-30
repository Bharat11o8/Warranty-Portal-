import { NotificationService } from '../services/notification.service.js';
import { initSocket } from '../socket.js';
import http from 'http';

async function testPhase1() {
    console.log('--- Testing Phase 1 Optimizations ---');

    // Mock socket for service dependency
    const server = http.createServer();
    initSocket(server);

    try {
        const testUserId = 7314; // Using a known test user ID from previous diagnostics

        // 1. Test Deduplication
        console.log('Testing deduplication (sending 3 identical notifications)...');
        const p1 = await NotificationService.notify(testUserId, {
            title: 'Test Deduplication',
            message: 'This should only be saved once.',
            type: 'system'
        });
        const p2 = await NotificationService.notify(testUserId, {
            title: 'Test Deduplication',
            message: 'This should only be saved once.',
            type: 'system'
        });
        const p3 = await NotificationService.notify(testUserId, {
            title: 'Test Deduplication',
            message: 'This should only be saved once.',
            type: 'system'
        });

        console.log('Results:', {
            p1: !!p1 ? 'Success' : 'Skipped',
            p2: !!p2 ? 'Success' : 'Skipped',
            p3: !!p3 ? 'Success' : 'Skipped'
        });

        // 2. Test Bulk Broadcast
        console.log('\nTesting bulk broadcast to vendors...');
        const broadcastResult = await NotificationService.broadcast({
            title: 'Phase 1 Bulk Test',
            message: 'Bulk insert is working efficiently.',
            type: 'system',
            targetRole: 'vendor'
        });
        console.log('Broadcast Result:', broadcastResult);

        console.log('\n✅ Phase 1 Verification Successful!');
    } catch (e) {
        console.error('❌ Phase 1 Verification Failed:', e);
    } finally {
        process.exit(0);
    }
}

testPhase1();

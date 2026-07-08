import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = `http://localhost:${PORT}/api/webhooks/interakt`;
const SECRET = process.env.INTERAKT_WEBHOOK_SECRET || 'a04bedd5-8471-4487-9009-e8aa32632d46';

async function sendTestWebhook() {
    console.log('Sending mock delivery status webhooks to local server...');

    const mockMessageId = 'test_interakt_msg_' + Date.now();

    // 1. Send 'message_api_sent'
    const sentPayload = {
        type: 'message_api_sent',
        data: {
            customer: {
                channel_phone_number: '917827889388'
            },
            message: {
                id: mockMessageId,
                message_status: 'sent'
            }
        }
    };

    // Calculate signature
    const signature = 'sha256=' + crypto
        .createHmac('sha256', SECRET)
        .update(JSON.stringify(sentPayload))
        .digest('hex');

    try {
        console.log(`\n1. Sending message_api_sent for message: ${mockMessageId}`);
        const res1 = await axios.post(WEBHOOK_URL, sentPayload, {
            headers: {
                'Content-Type': 'application/json',
                'interakt-signature': signature
            }
        });
        console.log('Response status:', res1.status, res1.data);

        // 2. Send 'message_api_delivered'
        const deliveredPayload = {
            type: 'message_api_delivered',
            data: {
                customer: {
                    channel_phone_number: '917827889388'
                },
                message: {
                    id: mockMessageId,
                    message_status: 'delivered'
                }
            }
        };

        const deliveredSig = 'sha256=' + crypto
            .createHmac('sha256', SECRET)
            .update(JSON.stringify(deliveredPayload))
            .digest('hex');

        console.log('\n2. Sending message_api_delivered...');
        const res2 = await axios.post(WEBHOOK_URL, deliveredPayload, {
            headers: {
                'Content-Type': 'application/json',
                'interakt-signature': deliveredSig
            }
        });
        console.log('Response status:', res2.status, res2.data);

        // 3. Send 'message_api_failed' to test error saving
        const failedPayload = {
            type: 'message_api_failed',
            data: {
                customer: {
                    channel_phone_number: '917827889388'
                },
                message: {
                    id: mockMessageId,
                    message_status: 'failed',
                    channel_error_code: '131049',
                    channel_failure_reason: 'Meta per-user marketing rate limit hit'
                }
            }
        };

        const failedSig = 'sha256=' + crypto
            .createHmac('sha256', SECRET)
            .update(JSON.stringify(failedPayload))
            .digest('hex');

        console.log('\n3. Sending message_api_failed (error 131049)...');
        const res3 = await axios.post(WEBHOOK_URL, failedPayload, {
            headers: {
                'Content-Type': 'application/json',
                'interakt-signature': failedSig
            }
        });
        console.log('Response status:', res3.status, res3.data);

        console.log('\n🎉 Test webhook suite completed successfully!');
    } catch (error: any) {
        console.error('❌ Failed to run webhook test:', error.response?.data || error.message);
    }
}

sendTestWebhook();

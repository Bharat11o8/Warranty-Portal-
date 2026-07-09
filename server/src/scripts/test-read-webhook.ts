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

async function sendReadWebhook() {
    const realMsgId = '8e94037d-719e-4e87-9eae-9b72265a0d5c';

    const payload = {
        type: 'message_api_read',
        data: {
            customer: {
                channel_phone_number: '917827889388'
            },
            message: {
                id: realMsgId,
                message_status: 'read'
            }
        }
    };

    const signature = 'sha256=' + crypto
        .createHmac('sha256', SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

    try {
        console.log(`Sending read webhook for message ID: ${realMsgId}`);
        const res = await axios.post(WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'interakt-signature': signature
            }
        });
        console.log('Response:', res.status, res.data);
    } catch (e: any) {
        console.error('Error:', e.response?.data || e.message);
    }
}

sendReadWebhook();

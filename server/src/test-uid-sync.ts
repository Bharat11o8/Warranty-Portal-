import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const API_KEY = process.env.UID_SYNC_API_KEY;
const BASE_URL = 'http://localhost:3000/api/uid/sync'; // Adjust if needed

async function testSync() {
    console.log('🚀 Starting UID Sync Verification Test...');

    const testUids = [
        "20260211000001", // New
        "20260211000002", // New
        "123",            // Invalid (too short)
        "20260211000001", // Duplicate in request
        "already_avail",  // To be set up
        "already_used"    // To be set up
    ];

    try {
        const response = await axios.post(BASE_URL, { uids: testUids }, {
            headers: { 'x-api-key': API_KEY }
        });

        console.log('\n✅ Response Summary:');
        console.table(response.data.stats);

        console.log('\n📝 Details:');
        console.table(response.data.details.map((d: any) => ({
            uid: d.uid,
            status: d.status,
            message: d.message,
            has_info: !!d.info
        })));

    } catch (error: any) {
        if (error.response) {
            console.error('❌ Error response:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testSync();

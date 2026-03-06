import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { WhatsAppService } from '../services/whatsapp.service.js';

/**
 * Quick test script to verify Interakt WhatsApp API integration.
 * 
 * Usage:
 *   npx tsx src/scripts/test-whatsapp.ts <phone_number>
 * 
 * Example:
 *   npx tsx src/scripts/test-whatsapp.ts 9876543210
 */
async function main() {
    const phone = process.argv[2];

    if (!phone) {
        console.error('❌ Usage: npx tsx src/scripts/test-whatsapp.ts <phone_number>');
        console.error('   Example: npx tsx src/scripts/test-whatsapp.ts 9876543210');
        process.exit(1);
    }

    console.log(`\n🔧 Interakt API Key: ${process.env.INTERAKT_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`📱 Sending test OTP to: ${phone}\n`);

    // Use a dummy OTP for testing
    const testOtp = '123456';

    const result = await WhatsAppService.sendLoginOTP(phone, 'Test User', testOtp);

    if (result) {
        console.log('\n🎉 SUCCESS! Message sent via Interakt.');
        console.log('📱 Check your WhatsApp for the OTP message.');
    } else {
        console.log('\n❌ FAILED. Check the error logs above.');
        console.log('Common issues:');
        console.log('  1. "login_otp" template not created/approved in Interakt dashboard');
        console.log('  2. API key is invalid or expired');
        console.log('  3. Phone number format issue');
    }

    // Give the DB log time to write, then exit
    setTimeout(() => process.exit(0), 2000);
}

main().catch(err => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
});

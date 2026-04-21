import { EmailService } from '../services/email.service.js';
import pool from '../config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Force production mode and remove localhost overrides so the email link is always the live domain
process.env.NODE_ENV = 'production';
delete process.env.FRONTEND_URL;
delete process.env.APP_URL;

const args = process.argv.slice(2);
const helpText = `
Usage:
  npx tsx src/scripts/test_welcome_email.ts "Franchise Name"
Example:
  npx tsx src/scripts/test_welcome_email.ts "BM_TEST_STORE"
`;

if (args.length < 1 || args[0] === '--help') {
  console.log(helpText);
  process.exit(1);
}

const storeName = args[0];

async function runTest() {
  console.log(`🔍 Searching for store: "${storeName}" in the database...`);
  try {
    const [rows]: any = await pool.execute('SELECT name, email FROM profiles WHERE name = ? LIMIT 1', [storeName]);
    
    if (!rows || rows.length === 0) {
      console.error(`❌ Store "${storeName}" not found or is not a vendor.`);
      process.exit(1);
    }

    const store = rows[0];
    console.log(`✅ Found store! Email: ${store.email}`);
    
    console.log(`🚀 Sending test welcome email to ${store.email}...`);
    await EmailService.sendFranchiseWelcomeEmail(store.email, store.name);
    console.log('✅ Success! Test email sent.');
  } catch (error) {
    console.error('❌ Failed to run test script:', error);
  } finally {
    await pool.end(); // Close DB connection so the script exits cleanly
  }
}

runTest();

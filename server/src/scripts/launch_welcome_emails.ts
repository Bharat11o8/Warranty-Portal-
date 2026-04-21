import { EmailService } from '../services/email.service.js';
import pool from '../config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Force production mode and remove localhost overrides so the email link is always the live domain
process.env.NODE_ENV = 'production';
delete process.env.FRONTEND_URL;
delete process.env.APP_URL;

const STATE_FILE = path.join(__dirname, 'launch_state.json');

// Helper to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runLaunch() {
  console.log('🚀 Starting FMS Launch Email Script...');
  console.log('----------------------------------------------------');

  // 1. Fetch all vendors
  console.log('📊 Fetching active vendor accounts from the database...');
  const [vendorRows]: any = await pool.execute(`
    SELECT p.name, p.email 
    FROM profiles p
    JOIN user_roles ur ON p.id = ur.user_id
    WHERE ur.role = 'vendor'
  `);

  if (!vendorRows || vendorRows.length === 0) {
    console.log('❌ No vendors found in the database. Aborting.');
    process.exit(1);
  }

  console.log(`✅ Found ${vendorRows.length} vendors in total.`);

  // 2. Load state to resume if stopped
  let state: string[] = [];
  try {
    if (fs.existsSync(STATE_FILE)) {
      const stateData = fs.readFileSync(STATE_FILE, 'utf-8');
      state = JSON.parse(stateData);
      console.log(`✅ Loaded state file! Skipping ${state.length} emails that were already sent...`);
    } else {
      console.log('✅ No previous state file found. Starting fresh.');
      fs.writeFileSync(STATE_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('❌ Failed to read state file. Aborting for safety.', error);
    process.exit(1);
  }

  // 3. Process each vendor sequentially
  let sentCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < vendorRows.length; i++) {
    const store = vendorRows[i];
    
    // Check if already sent
    if (state.includes(store.email)) {
      skipCount++;
      continue;
    }

    const currentCount = sentCount + skipCount + 1;
    console.log(`[${currentCount}/${vendorRows.length}] Sending to: ${store.name} (${store.email})...`);

    try {
      await EmailService.sendFranchiseWelcomeEmail(store.email, store.name);
      
      // Update state immediately
      state.push(store.email);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      sentCount++;
      
      // Throttle: 3 seconds delay between each email prevents Gmail from blocking the SMTP connection
      if (currentCount < vendorRows.length) {
        await sleep(3000);
      }
    } catch (error: any) {
      console.error(`❌ ERROR sending to ${store.email}: ${error.message}`);
      // Continue to next anyway, the state won't update so we can retry them later
    }
  }

  console.log('----------------------------------------------------');
  console.log('🎉 LAUNCH SCRIPT COMPLETE!');
  console.log(`Total vendor profiles found: ${vendorRows.length}`);
  console.log(`Skipped (already sent): ${skipCount}`);
  console.log(`Successfully sent this session: ${sentCount}`);
  
  await pool.end();
  process.exit(0);
}

runLaunch();

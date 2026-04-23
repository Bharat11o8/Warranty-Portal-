import { EmailService } from '../services/email.service.js';
import pool from '../config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Force production mode to ensure correct URLs in the emails
process.env.NODE_ENV = 'production';
delete process.env.FRONTEND_URL;
delete process.env.APP_URL;

const updates = [
  { storeName: 'AR CREATIVE SHOPPE', oldEmail: 'e.arcreativeshoppe@gmail.com', newEmail: 'arcreativeshoppe@gmail.com' },
  { storeName: 'CAR SHRINGAR', oldEmail: 'hppaliwal0106@gmail.com', newEmail: 'hpaliwal0106@gmail.com' },
  { storeName: 'JAI SHIVE SAKTI MOTORS', oldEmail: 'jaishiveshkati56@gmail.com', newEmail: 'jaishivshkati56@gmail.com' },
  { storeName: 'JP CAR ACCESSORIES', oldEmail: 'jpcaraccessoriesvns@gmail.com', newEmail: 'jpcaraccessoriesvsn@gmail.com' },
  { storeName: 'TM CAR ACCESSORIES', oldEmail: 'meghalhitengrakumar@gmail.com', newEmail: 'meghalhitendrakumar@gmail.com' },
  { storeName: 'NEW CAR BEAUTY', oldEmail: 'ncbcangamaly@gmail.com', newEmail: 'cdseby@gmail.com' },
  { storeName: 'SAI CAR DECOR', oldEmail: 'neleshgoyal0@gmail.com', newEmail: 'neleshgoyal0@gmail.com' },
  { storeName: 'VEENA CAR SAJAWAT', oldEmail: 'rajveer.din@gmail.com', newEmail: 'rajveer.bin@gmail.com' },
  { storeName: 'RS CAR MODIFIERS', oldEmail: 'rscarmodifires@gmail.com', newEmail: 'rscarmodifiers@gmail.com' },
  { storeName: 'SAI TOP GEAR', oldEmail: 'saitopgear@gmail.com', newEmail: 'saitopgear96@gmail.com' },
  { storeName: 'SHIV CAR DECOR', oldEmail: 'shivacardecor15@gmail.com', newEmail: 'shivcardecor15@gmail.com' },
  { storeName: 'BHATT CAR ACCESSORIES', oldEmail: 'showkatahmad4885@gmail.com', newEmail: 'showkatbhat4885@gmail.com' },
  { storeName: 'CAR HUB', oldEmail: 'skpacking@rediffmail.com', newEmail: 'skpackaging404@rediffmail.com' },
  { storeName: 'RAJ MOTORS', oldEmail: 'sunnybhatai3011@gmail.com', newEmail: 'sunnybhatia3011@gmail.com' },
  { storeName: 'VB CAR PALACE', oldEmail: 'vishalgupta83898@gmail.com', newEmail: 'vishalgupta8398@gmail.com' }
];

async function runUpdateAndSend() {
  console.log('🚀 Starting targeted batch update and email resend...');
  console.log(`Processing ${updates.length} vendors...\\n`);

  let successCount = 0;
  let updateCount = 0;

  for (const { storeName, oldEmail, newEmail } of updates) {
    console.log(`------------------------------------------------`);
    console.log(`📌 Processing: ${storeName}`);
    
    try {
      // Check if we actually need to update the database
      if (oldEmail.toLowerCase() !== newEmail.toLowerCase()) {
        console.log(`   🔄 Updating DB: ${oldEmail} -> ${newEmail}`);
        const [result]: any = await pool.execute(
          'UPDATE profiles SET email = ? WHERE email = ?',
          [newEmail, oldEmail]
        );
        
        if (result.affectedRows === 0) {
           console.log(`   ⚠️ WARNING: Old email (${oldEmail}) not found in the database. Trying to see if it's already updated...`);
           const [checkRows]: any = await pool.execute('SELECT email FROM profiles WHERE email = ?', [newEmail]);
           if (checkRows.length === 0) {
              console.log(`   ❌ ERROR: Neither old nor new email found in profiles table.`);
              continue; // Skip sending email if they aren't in the DB at all
           } else {
              console.log(`   ✅ DB is already up-to-date with ${newEmail}. Proceeding to email.`);
           }
        } else {
           console.log(`   ✅ Database updated.`);
           updateCount++;
        }
      } else {
        console.log(`   ⏭️ Skipping DB update (Old and New emails are identical: ${newEmail})`);
        
        // Still verify it exists
        const [checkRows]: any = await pool.execute('SELECT email FROM profiles WHERE email = ?', [newEmail]);
        if (checkRows.length === 0) {
          console.log(`   ❌ ERROR: Email ${newEmail} not found in profiles table.`);
          continue;
        }
      }

      // Send the welcome email
      console.log(`   ✉️  Sending Welcome Email to: ${newEmail}...`);
      await EmailService.sendFranchiseWelcomeEmail(newEmail, storeName);
      console.log(`   ✅ Email dispatched successfully!`);
      successCount++;
      
    } catch (error: any) {
      console.log(`   ❌ FAILED: ${error.message}`);
    }
  }

  console.log(`\\n================================================`);
  console.log(`🎉 BATCH COMPLETE`);
  console.log(`Updated in DB: ${updateCount}/${updates.length}`);
  console.log(`Emails successfully sent: ${successCount}/${updates.length}`);
  console.log(`================================================\\n`);

  await pool.end();
  process.exit(0);
}

runUpdateAndSend();

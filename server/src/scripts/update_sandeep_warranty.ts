import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

async function updateSandeepWarranty() {
  try {
    const newEmail = 'javedkhanvelocity@gmail.com';
    const uid = '25112402392968';
    
    console.log(`--- UPDATING WARRANTY ${uid} ---`);
    
    // 1. Check if profile exists (double check)
    const [existing]: any = await db.execute('SELECT id FROM profiles WHERE email = ?', [newEmail]);
    let userId;
    
    if (existing.length > 0) {
      userId = existing[0].id;
      console.log(`Profile already exists with ID: ${userId}`);
    } else {
      userId = uuidv4();
      console.log(`Creating new profile with ID: ${userId}`);
      
      // Create profile for Sandeep Sharma
      await db.execute(
        'INSERT INTO profiles (id, email, name, phone_number) VALUES (?, ?, ?, ?)',
        [userId, newEmail, 'SANDEEP SHARMA', '9009002622']
      );
      
      // Assign customer role
      await db.execute(
        'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
        [uuidv4(), userId, 'customer']
      );
    }
    
    // 2. Update warranty registration
    const [result]: any = await db.execute(
      'UPDATE warranty_registrations SET customer_email = ?, user_id = ? WHERE uid = ?',
      [newEmail, userId, uid]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Warranty updated successfully.');
    } else {
      console.error('❌ Warranty not found or update failed.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

updateSandeepWarranty();

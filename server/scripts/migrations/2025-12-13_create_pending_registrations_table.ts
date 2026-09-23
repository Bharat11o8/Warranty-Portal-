import db from '../../src/config/database.js';

async function createPendingRegistrationsTable() {
  try {
    console.log('Creating pending_registrations table...');

    // Create the pending_registrations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        role ENUM('customer', 'vendor', 'admin') NOT NULL,
        store_name VARCHAR(255),
        store_email VARCHAR(255),
        address TEXT,
        state VARCHAR(100),
        city VARCHAR(100),
        pincode VARCHAR(10),
        manpower_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        INDEX idx_pending_email (email),
        INDEX idx_pending_expires (expires_at)
      )
    `);

    console.log('✅ pending_registrations table created successfully!');

    // Create an event to auto-cleanup expired entries every 5 minutes
    // Note: MySQL events need to be enabled (SET GLOBAL event_scheduler = ON;)
    try {
      await db.execute(`
        CREATE EVENT IF NOT EXISTS cleanup_expired_pending_registrations
        ON SCHEDULE EVERY 5 MINUTE
        DO
          DELETE FROM pending_registrations WHERE expires_at < NOW()
      `);
      console.log('✅ Auto-cleanup event created successfully!');
    } catch (eventError: any) {
      console.log('⚠️  Could not create MySQL event (events may be disabled). Manual cleanup will be used.');
      console.log('   Error:', eventError.message);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating table:', error.message);
    process.exit(1);
  }
}

createPendingRegistrationsTable();

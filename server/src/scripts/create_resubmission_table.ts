import db from '../config/database.js';

async function createStagingTable() {
  try {
    console.log('--- CREATING WARRANTY RESUBMISSIONS STAGING TABLE ---');

    // Create the table mirroring warranty_registrations
    // We remove the foreign key constraint to profiles to make it a pure data staging area
    // and add an original_warranty_id to link back easily.
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`warranty_resubmissions\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`original_uid\` varchar(255) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`product_type\` varchar(100) NOT NULL,
        \`customer_name\` varchar(255) NOT NULL,
        \`customer_email\` varchar(255) NOT NULL,
        \`customer_phone\` varchar(20) NOT NULL,
        \`customer_address\` text NOT NULL,
        \`car_make\` varchar(100) DEFAULT NULL,
        \`car_model\` varchar(100) DEFAULT NULL,
        \`car_year\` varchar(4) NOT NULL,
        \`registration_number\` varchar(50) NOT NULL,
        \`purchase_date\` date NOT NULL,
        \`installer_name\` varchar(255) DEFAULT NULL,
        \`installer_contact\` varchar(255) DEFAULT NULL,
        \`product_details\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(\`product_details\`)),
        \`manpower_id\` varchar(36) DEFAULT NULL,
        \`status\` enum('pending_review', 'approved', 'rejected') DEFAULT 'pending_review',
        \`admin_notes\` text DEFAULT NULL,
        \`created_at\` timestamp NULL DEFAULT current_timestamp(),
        \`warranty_type\` varchar(50) NOT NULL DEFAULT '1 Year',
        \`exif_lat\` decimal(10,7) DEFAULT NULL,
        \`exif_lng\` decimal(10,7) DEFAULT NULL,
        \`exif_timestamp\` datetime DEFAULT NULL,
        \`exif_device\` varchar(100) DEFAULT NULL,
        \`device_fingerprint\` varchar(255) DEFAULT NULL,
        \`submission_ip\` varchar(45) DEFAULT NULL,
        \`ip_city\` varchar(100) DEFAULT NULL,
        \`ip_region\` varchar(100) DEFAULT NULL,
        \`ip_lat\` decimal(10,7) DEFAULT NULL,
        \`ip_lng\` decimal(10,7) DEFAULT NULL,
        \`fraud_score\` tinyint(4) DEFAULT 0,
        \`fraud_flags\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(\`fraud_flags\`)),
        \`seat_cover_photo_url\` text DEFAULT NULL,
        \`car_outer_photo_url\` text DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`idx_unique_resubmission_uid\` (\`original_uid\`),
        KEY \`idx_resub_created_at\` (\`created_at\`),
        KEY \`idx_resub_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Staging table "warranty_resubmissions" created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create staging table:', error);
    process.exit(1);
  }
}

createStagingTable();

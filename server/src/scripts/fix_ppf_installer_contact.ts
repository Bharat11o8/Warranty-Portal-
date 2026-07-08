import db from '../config/database.js';

/**
 * Migration script: Fix PPF (ev-products) installer_contact values
 * 
 * Problem: EVProductsForm was storing "email | phone" in installer_contact,
 *          but all SQL queries use exact-match against vendor_details.store_email.
 *          This caused PPF warranties to be invisible in vendor dashboards.
 * 
 * Fix: Strip the " | phone" suffix, keeping only the email.
 * Safety: The phone number is already stored inside product_details JSON 
 *         (as dealerMobile), so NO data is lost.
 * 
 * Affects: warranty_registrations + warranty_resubmissions
 */
async function fixPPFInstallerContact() {
  const connection = await (db as any).getConnection();
  
  try {
    // ── DRY RUN: Show what will be affected ──────────────────────────────
    console.log('=== DRY RUN: Previewing affected records ===\n');

    const [affectedRegistrations]: any = await connection.execute(
      `SELECT uid, installer_contact, 
              TRIM(SUBSTRING_INDEX(installer_contact, '|', 1)) AS email_only
       FROM warranty_registrations 
       WHERE product_type = 'ev-products' 
         AND installer_contact LIKE '%|%'`
    );

    console.log(`📋 warranty_registrations: ${affectedRegistrations.length} records to fix`);
    for (const row of affectedRegistrations) {
      console.log(`   UID: ${row.uid} | "${row.installer_contact}" → "${row.email_only}"`);
    }

    const [affectedResubmissions]: any = await connection.execute(
      `SELECT id, original_uid, installer_contact,
              TRIM(SUBSTRING_INDEX(installer_contact, '|', 1)) AS email_only
       FROM warranty_resubmissions 
       WHERE installer_contact LIKE '%|%'`
    );

    console.log(`📋 warranty_resubmissions: ${affectedResubmissions.length} records to fix`);
    for (const row of affectedResubmissions) {
      console.log(`   ID: ${row.id} (UID: ${row.original_uid}) | "${row.installer_contact}" → "${row.email_only}"`);
    }

    if (affectedRegistrations.length === 0 && affectedResubmissions.length === 0) {
      console.log('\n✅ No records need fixing. All clean!');
      process.exit(0);
    }

    // ── EXECUTE FIX ─────────────────────────────────────────────────────
    console.log('\n=== Applying fix in a transaction ===\n');
    await connection.beginTransaction();

    // Fix warranty_registrations
    const [regResult]: any = await connection.execute(
      `UPDATE warranty_registrations 
       SET installer_contact = TRIM(SUBSTRING_INDEX(installer_contact, '|', 1))
       WHERE product_type = 'ev-products' 
         AND installer_contact LIKE '%|%'`
    );
    console.log(`✅ warranty_registrations: ${regResult.affectedRows} rows updated`);

    // Fix warranty_resubmissions
    const [resubResult]: any = await connection.execute(
      `UPDATE warranty_resubmissions 
       SET installer_contact = TRIM(SUBSTRING_INDEX(installer_contact, '|', 1))
       WHERE installer_contact LIKE '%|%'`
    );
    console.log(`✅ warranty_resubmissions: ${resubResult.affectedRows} rows updated`);

    await connection.commit();
    console.log('\n🎉 Migration complete! All installer_contact values are now plain emails.');

    // ── VERIFY ──────────────────────────────────────────────────────────
    console.log('\n=== Post-fix verification ===');
    const [remaining]: any = await connection.execute(
      `SELECT COUNT(*) as count FROM warranty_registrations 
       WHERE product_type = 'ev-products' AND installer_contact LIKE '%|%'`
    );
    console.log(`Remaining pipe records in warranty_registrations: ${remaining[0].count}`);

    const [remainingResub]: any = await connection.execute(
      `SELECT COUNT(*) as count FROM warranty_resubmissions 
       WHERE installer_contact LIKE '%|%'`
    );
    console.log(`Remaining pipe records in warranty_resubmissions: ${remainingResub[0].count}`);

    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration FAILED — transaction rolled back. No data was changed.');
    console.error(error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

fixPPFInstallerContact();

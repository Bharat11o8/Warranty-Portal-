import db from '../config/database.js';

async function checkPpfData() {
  try {
    console.log('--- INSPECTING EXISTING PPF WARRANTIES ---');
    const [rows]: any = await db.execute(
      "SELECT uid, installer_name, installer_contact, product_details FROM warranty_registrations WHERE product_type = 'ev-products' LIMIT 5"
    );

    if (rows.length === 0) {
      console.log('No PPF warranties found in the database.');
    } else {
      rows.forEach((row: any) => {
        let details = {};
        try {
          details = typeof row.product_details === 'string' 
            ? JSON.parse(row.product_details) 
            : row.product_details || {};
        } catch (e) {
          details = { error: 'Failed to parse JSON' };
        }

        console.log(`\nUID: ${row.uid}`);
        console.log(`Installer Name: ${row.installer_name}`);
        console.log(`Installer Contact (String): ${row.installer_contact}`);
        console.log(`Dealer Email in JSON: ${(details as any).storeEmail || 'Not Found'}`);
        console.log(`Dealer Mobile in JSON: ${(details as any).dealerMobile || 'Not Found'}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking PPF data:', error);
    process.exit(1);
  }
}

checkPpfData();

import db from '../config/database.js';

async function inspectSchema() {
    try {
        console.log('--- vendor_details table structure ---');
        const [columns]: any = await db.execute('DESCRIBE vendor_details');
        console.table(columns);

        console.log('\n--- data sample ---');
        const [samples]: any = await db.execute('SELECT * FROM vendor_details LIMIT 1');
        console.log(JSON.stringify(samples, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

inspectSchema();

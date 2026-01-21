import db from '../config/database.js';

async function checkSchema() {
    try {
        const [rows]: any = await db.execute('DESCRIBE warranty_registrations');
        console.log('Schema for warranty_registrations:');
        rows.forEach((row: any) => {
            console.log(`${row.Field} - ${row.Type}`);
        });
    } catch (error) {
        console.error('Error fetching schema:', error);
    } finally {
        process.exit(0);
    }
}

checkSchema();

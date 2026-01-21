import db from '../config/database.js';

async function checkSchema() {
    try {
        const [rows]: any = await db.execute('DESCRIBE warranty_registrations');
        console.log('--- SCHEMA START ---');
        rows.forEach((row: any) => {
            console.log(`FIELD: ${row.Field} | TYPE: ${row.Type}`);
        });
        console.log('--- SCHEMA END ---');
    } catch (error) {
        console.error('Error fetching schema:', error);
    } finally {
        process.exit(0);
    }
}

checkSchema();

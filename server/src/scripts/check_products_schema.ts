
import db from '../config/database.js';

async function checkSchema() {
    try {
        const [rows]: any = await db.execute('DESCRIBE products');
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error('Failed to check schema:', error);
        process.exit(1);
    }
}

checkSchema();

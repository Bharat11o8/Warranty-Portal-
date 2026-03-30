import db from '../config/database.js';

async function updateGrievanceCategoryEnum() {
    console.log('Updating grievances.category ENUM to include franchise-specific values...');
    try {
        await db.execute(`
            ALTER TABLE grievances
            MODIFY COLUMN category ENUM(
                'product_issue',
                'billing_issue',
                'store_issue',
                'manpower_issue',
                'service_issue',
                'warranty_issue',
                'logistics_issue',
                'stock_issue',
                'software_issue',
                'other'
            ) NOT NULL
        `);
        console.log('✅ category ENUM updated successfully.');
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

updateGrievanceCategoryEnum();

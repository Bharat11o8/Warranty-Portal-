import db from '../config/database.js';

const addUpdatedAtToProducts = async () => {
    try {
        console.log('Adding updated_at column to products table...');

        await db.execute(`
            ALTER TABLE products
            ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);

        console.log('Column updated_at added successfully');
        process.exit(0);
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column updated_at already exists');
            process.exit(0);
        }
        console.error('Error adding updated_at column:', error);
        process.exit(1);
    }
};

addUpdatedAtToProducts();

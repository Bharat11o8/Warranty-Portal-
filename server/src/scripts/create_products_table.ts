import db from '../config/database.js';

const createProductsTable = async () => {
    try {
        console.log('Creating products table...');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type ENUM('seat_cover', 'ev_product') NOT NULL,
                warranty_years VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Products table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating products table:', error);
        process.exit(1);
    }
};

createProductsTable();

import db from '../config/database.js';

async function addDistributorConfirmationNote() {
    const connection = await db.getConnection();
    try {
        console.log('Adding distributor_confirmation_note column to store_orders...');

        const [existing]: any = await connection.query(
            `SHOW COLUMNS FROM store_orders LIKE 'distributor_confirmation_note'`
        );

        if (existing.length === 0) {
            await connection.query(
                `ALTER TABLE store_orders
                 ADD COLUMN distributor_confirmation_note TEXT DEFAULT NULL`
            );
            console.log('Added distributor_confirmation_note column successfully.');
        } else {
            console.log('distributor_confirmation_note column already exists.');
        }
    } catch (error) {
        console.error('Failed to add distributor_confirmation_note column:', error);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

addDistributorConfirmationNote();

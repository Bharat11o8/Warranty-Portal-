import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const [rows] = await db.execute('SELECT uid, product_details FROM warranty_registrations ORDER BY created_at DESC LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
}
run();

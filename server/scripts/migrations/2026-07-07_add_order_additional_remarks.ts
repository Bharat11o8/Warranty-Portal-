import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function addOrderAdditionalRemarks() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
  });

  try {
    const [columns]: any = await connection.query(
      `SHOW COLUMNS FROM store_orders LIKE 'additional_remarks'`
    );

    if (columns.length === 0) {
      await connection.query(
        `ALTER TABLE store_orders ADD COLUMN additional_remarks TEXT DEFAULT NULL AFTER shipping_pincode`
      );
      console.log('✅ Added additional_remarks column to store_orders.');
    } else {
      console.log('ℹ️ additional_remarks already exists in store_orders.');
    }
  } catch (error) {
    console.error('Failed to add additional_remarks column:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

addOrderAdditionalRemarks();

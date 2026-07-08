import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function queryLogs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    try {
        const [rows]: any = await connection.query(
            `SELECT id, recipient_phone, template_name, status, interakt_message_id, campaign_id, error_code, error_message, created_at 
             FROM message_logs 
             ORDER BY created_at DESC 
             LIMIT 10`
        );
        console.log('\n--- LAST 10 MESSAGE LOGS ---');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await connection.end();
    }
}

queryLogs();

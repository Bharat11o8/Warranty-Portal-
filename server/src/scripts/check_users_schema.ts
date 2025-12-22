
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkSchema() {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT) || 3306
        });

        console.log('Connected!');

        const tables = ['user_roles'];

        for (const table of tables) {
            console.log(`\n--- Structure of ${table} ---`);
            const [columns] = await connection.execute(`SHOW COLUMNS FROM ${table}`) as [any[], any];
            columns.forEach((col: any) => {
                console.log(`${col.Field} (${col.Type}) Key:${col.Key} Extra:${col.Extra}`);
            });
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runSql() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('Usage: tsx src/scripts/run_sql.ts <path_to_sql_file>');
        process.exit(1);
    }

    const migrationPath = path.resolve(process.cwd(), sqlFile);
    if (!fs.existsSync(migrationPath)) {
        console.error(`File not found: ${migrationPath}`);
        process.exit(1);
    }

    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'warranty_db',
            multipleStatements: true
        });

        console.log('Connected!');
        console.log(`Reading SQL file from: ${migrationPath}`);
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing SQL...');
        await connection.query(sql);

        console.log('✅ SQL executed successfully!');

    } catch (error) {
        console.error('❌ SQL execution failed:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

runSql();

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const config = {
    host: 'srv839.hstgr.io',
    user: process.env.DB_USER || 'u823909847_warr',
    password: process.env.DB_PASSWORD || '@V+S&7Fc?f3V',
    database: 'u823909847_warranty'
};

const uids = ['26041302432606', '26041302432620', '26032502427391', '26032302426664', '26031902425824', '26031602424705', '26031602424404', '25122902403812', '261480004540587', '26030202421275', '25122302402392', '25102302384412', '25100402380610', '25081602368091', '26010302405294', '26021602417718', '25101502383419'];

async function backup() {
    let db;
    try {
        db = await mysql.createConnection(config);
        console.log('--- BACKING UP 17 TARGET RECORDS ---');
        
        const [rows] = await db.query('SELECT * FROM warranty_registrations WHERE uid IN (?)', [uids]);
        
        fs.writeFileSync('../scratch/pre_patch_backup.json', JSON.stringify(rows, null, 2));
        console.log(`✅ Backup complete! Saved ${rows.length} records to scratch/pre_patch_backup.json`);
        
    } catch (err) {
        console.error('Backup failed:', err);
    } finally {
        if (db) await db.end();
    }
}

backup();

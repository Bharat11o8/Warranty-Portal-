import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const fullPermissions = {
    overview:          { read: true, write: true },
    warranties:        { read: true, write: true },
    warranty_products: { read: true, write: true },
    uid_management:    { read: true, write: true },
    warranty_form:     { read: true, write: true },
    vendors:           { read: true, write: true },
    customers:         { read: true, write: true },
    products:          { read: true, write: true },
    announcements:     { read: true, write: true },
    grievances:        { read: true, write: true },
    posm:              { read: true, write: true },
    ecatalogue:        { read: true, write: true },
    terms:             { read: true, write: true },
    old_warranties:    { read: true, write: true },
    activity_logs:     { read: true, write: false },
};

async function runMigration() {
    console.log('🔧 Connecting to database...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    console.log('✅ Connected');

    try {
        // 1. Create admin_permissions table
        console.log('\n[1/3] Creating admin_permissions table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_permissions (
                id              VARCHAR(36)  PRIMARY KEY,
                admin_id        VARCHAR(36)  NOT NULL UNIQUE,
                is_super_admin  TINYINT(1)   NOT NULL DEFAULT 0,
                permissions     JSON         NOT NULL,
                created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✅ Table ready.');

        // 2. Fetch all existing admins
        console.log('\n[2/3] Seeding permissions for existing admins...');
        const [adminRows]: any = await connection.query(`
            SELECT p.id, p.name, p.email
            FROM profiles p
            JOIN user_roles ur ON p.id = ur.user_id
            WHERE ur.role = 'admin'
        `);

        if (adminRows.length === 0) {
            console.log('  ⚠️  No admin accounts found.');
        } else {
            for (const admin of adminRows) {
                const [existing]: any = await connection.query(
                    'SELECT id FROM admin_permissions WHERE admin_id = ?',
                    [admin.id]
                );
                if (existing.length > 0) {
                    console.log(`  ⏭  Skipped ${admin.email} (row already exists)`);
                    continue;
                }
                await connection.query(
                    'INSERT INTO admin_permissions (id, admin_id, is_super_admin, permissions) VALUES (?, ?, 0, ?)',
                    [uuidv4(), admin.id, JSON.stringify(fullPermissions)]
                );
                console.log(`  ✅ Seeded: ${admin.email}`);
            }
        }

        // 3. Done
        console.log('\n[3/3] Migration complete! ✅');
        console.log('\n👉 Next step: run  npm run promote:superadmin  to designate your Super Admin.\n');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

runMigration();

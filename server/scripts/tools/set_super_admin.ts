import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ──────────────────────────────────────────────────────────
// Set the email of the admin you want to designate as Super Admin
const SUPER_ADMIN_EMAIL = 'dev@autoformindia.com';
// ──────────────────────────────────────────────────────────

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
    activity_logs:     { read: true, write: true },
};

async function promoteSuperAdmin() {
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
        // Look up the admin
        const [users]: any = await connection.execute(
            `SELECT p.id, p.name, ur.role
             FROM profiles p
             JOIN user_roles ur ON p.id = ur.user_id
             WHERE p.email = ? AND ur.role = 'admin'`,
            [SUPER_ADMIN_EMAIL]
        );

        if (users.length === 0) {
            console.error(`❌ No admin found with email: ${SUPER_ADMIN_EMAIL}`);
            console.log('   Make sure the user exists and has the "admin" role first.');
            return;
        }

        const { id: adminId, name } = users[0];
        console.log(`👤 Found admin: ${name} (${adminId})`);

        // Upsert into admin_permissions with is_super_admin = true
        const [existing]: any = await connection.execute(
            'SELECT id FROM admin_permissions WHERE admin_id = ?',
            [adminId]
        );

        if (existing.length > 0) {
            await connection.execute(
                'UPDATE admin_permissions SET is_super_admin = 1, permissions = ? WHERE admin_id = ?',
                [JSON.stringify(fullPermissions), adminId]
            );
            console.log(`✅ Updated ${SUPER_ADMIN_EMAIL} → is_super_admin = TRUE`);
        } else {
            await connection.execute(
                'INSERT INTO admin_permissions (id, admin_id, is_super_admin, permissions) VALUES (?, ?, 1, ?)',
                [uuidv4(), adminId, JSON.stringify(fullPermissions)]
            );
            console.log(`✅ Inserted ${SUPER_ADMIN_EMAIL} → is_super_admin = TRUE`);
        }

        console.log(`\n🎉 ${name} is now the Super Admin!`);
        console.log('   All existing admin sessions must re-login to pick up the change.\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

promoteSuperAdmin();

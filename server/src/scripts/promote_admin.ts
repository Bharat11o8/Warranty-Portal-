
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_EMAIL = 'aarrti@autoformindia.com';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function promoteToAdmin() {
    console.log('🔧 Connecting to database...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306
    });

    console.log('✅ Connected to database');


    try {
        // Check if user exists
        const [users]: any = await connection.execute(
            'SELECT id, name FROM profiles WHERE email = ?',
            [TARGET_EMAIL]
        );

        let userId;

        if (users.length === 0) {
            console.log(`⚠️  User with email ${TARGET_EMAIL} not found.`);
            console.log('🆕 Creating new admin user...');

            userId = uuidv4();
            console.log('generated userId:', userId);
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            const name = 'Aarti';
            const randomPhone = Math.floor(Math.random() * 9000000000) + 1000000000;

            await connection.execute(
                'INSERT INTO profiles (id, name, email, password, phone_number) VALUES (?, ?, ?, ?, ?)',
                [userId, name, TARGET_EMAIL, hashedPassword, String(randomPhone)]
            );
            console.log('✅ User created successfully.');
        } else {
            const user = users[0];
            userId = user.id;
            console.log(`👤 Found user: ${user.name} (${user.id})`);
        }

        // Check current role
        const [roles]: any = await connection.execute(
            'SELECT role FROM user_roles WHERE user_id = ?',
            [userId]
        );

        if (roles.length > 0 && roles[0].role === 'admin') {
            console.log(`ℹ️  User is already an admin.`);
            return;
        }

        // Update or Insert role
        if (roles.length > 0) {
            console.log('🔄 Updating role to admin...');
            await connection.execute(
                'UPDATE user_roles SET role = ? WHERE user_id = ?',
                ['admin', userId]
            );
        } else {
            console.log('➕ Inserting admin role...');
            await connection.execute(
                'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
                [userId, 'admin']
            );
        }

        console.log(`✅ Successfully promoted ${TARGET_EMAIL} to ADMIN!`);
        console.log('📧 Email:', TARGET_EMAIL);
        console.log('🔑 Password: Admin@123');

    } catch (error: any) {
        console.error('❌ Failed to promote user:', error.message);
    } finally {
        await connection.end();
    }
}

promoteToAdmin();

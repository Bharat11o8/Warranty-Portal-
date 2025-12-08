import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Default admin credentials
const DEFAULT_ADMIN = {
    email: 'prabhat@autoformindia.com',
    password: 'Admin@123',
    name: 'Admin User'
};
// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
async function seedAdmin() {
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
        // Check if admin already exists
        const [existingUsers] = await connection.execute('SELECT id FROM profiles WHERE email = ?', [DEFAULT_ADMIN.email]);
        if (existingUsers.length > 0) {
            console.log('⚠️  Admin user already exists with email:', DEFAULT_ADMIN.email);
            console.log('ℹ️  Email:', DEFAULT_ADMIN.email);
            console.log('ℹ️  Password: Admin@123');
            return;
        }
        // Create admin user
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
        // Insert into profiles
        await connection.execute('INSERT INTO profiles (id, name, email, password, phone_number) VALUES (?, ?, ?, ?, ?)', [userId, DEFAULT_ADMIN.name, DEFAULT_ADMIN.email, hashedPassword, '0000000000']);
        // Insert into user_roles
        await connection.execute('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, 'admin']);
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email:', DEFAULT_ADMIN.email);
        console.log('🔑 Password: Admin@123');
        console.log('');
        console.log('⚠️  IMPORTANT: Change the password after first login!');
    }
    catch (error) {
        console.error('❌ Failed to create admin user:', error.message);
    }
    finally {
        await connection.end();
    }
}
seedAdmin();

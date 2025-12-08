import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load .env from server directory
dotenv.config({ path: join(__dirname, '../../.env') });
console.log('📧 Email Configuration:');
console.log('Service:', process.env.EMAIL_SERVICE);
console.log('User:', process.env.EMAIL_USER);
console.log('From:', process.env.EMAIL_FROM);
export const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
// Verify email configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('✗ Email configuration error:', error.message);
    }
    else {
        console.log('✓ Email server is ready to send messages');
    }
});

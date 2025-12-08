import { v4 as uuidv4 } from "uuid";
import db from "../config/database";
import nodemailer from "nodemailer"; // if you want to send via email
export class OTPService {
    static generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    static async createOTP(userId) {
        const otp = this.generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await db.execute("INSERT INTO otp_codes (id, user_id, otp_code, expires_at) VALUES (?, ?, ?, ?)", [uuidv4(), userId, otp, expiresAt]);
        return otp;
    }
    static async verifyOTP(userId, otp) {
        const [rows] = await db.execute(`SELECT * FROM otp_codes 
       WHERE user_id = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`, [userId, otp]);
        if (rows.length === 0)
            return false;
        await db.execute("UPDATE otp_codes SET is_used = TRUE WHERE id = ?", [rows[0].id]);
        return true;
    }
    // ✅ Add this method
    static async generateAndSendOTP(userId, email) {
        const otp = await this.createOTP(userId);
        // Send OTP via email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false, // true for 465
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        await transporter.sendMail({
            from: `"Warranty App" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
        });
        return otp;
    }
}

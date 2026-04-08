import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import db from "../config/database.js";
export class OTPService {
    static generateOTP() {
        // Use cryptographically secure random number generation
        return crypto.randomInt(100000, 999999).toString();
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
}

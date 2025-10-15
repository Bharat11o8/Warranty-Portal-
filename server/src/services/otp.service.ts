import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';

export class OTPService {
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async createOTP(userId: string): Promise<string> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.execute(
      'INSERT INTO otp_codes (id, user_id, otp_code, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, otp, expiresAt]
    );

    return otp;
  }

  static async verifyOTP(userId: string, otp: string): Promise<boolean> {
    const [rows]: any = await db.execute(
      `SELECT * FROM otp_codes 
       WHERE user_id = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, otp]
    );

    if (rows.length === 0) {
      return false;
    }

    // Mark OTP as used
    await db.execute(
      'UPDATE otp_codes SET is_used = TRUE WHERE id = ?',
      [rows[0].id]
    );

    return true;
  }
}
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import db from "../config/database.js";
import { redis } from "../config/redis.js";

export class OTPService {
  static generateOTP(): string {
    // Use cryptographically secure random number generation
    return crypto.randomInt(100000, 999999).toString();
  }

  static async createOTP(userId: string): Promise<string> {
    const otp = this.generateOTP();
    const expiresInSeconds = 10 * 60; // 10 minutes
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // 1. Write to Redis (if configured)
    if (redis) {
      try {
        await redis.setex(`otp:${userId}`, expiresInSeconds, otp);
      } catch (error) {
        console.error('[OTPService] Redis setex failed, falling back to MySQL only:', error);
      }
    }

    // 2. Dual Write to MySQL (Fallback)
    try {
      await db.execute(
        "INSERT INTO otp_codes (id, user_id, otp_code, expires_at) VALUES (?, ?, ?, ?)",
        [uuidv4(), userId, otp, expiresAt]
      );
    } catch (error) {
      console.error('[OTPService] MySQL insert failed:', error);
      throw error;
    }

    return otp;
  }

  static async verifyOTP(userId: string, otp: string): Promise<boolean> {
    // 1. Try to verify via Redis first
    if (redis) {
      try {
        const storedOtp = await redis.get(`otp:${userId}`);
        
        if (storedOtp) {
          // If found in Redis, check if it matches
          if (storedOtp === otp) {
            // Success! Delete the key to prevent reuse
            await redis.del(`otp:${userId}`);
            
            // Keep dual-write state consistent
            try {
                await db.execute(
                  `UPDATE otp_codes SET is_used = TRUE 
                   WHERE user_id = ? AND otp_code = ? AND is_used = FALSE`,
                  [userId, otp]
                );
            } catch (err) {
                console.error('[OTPService] Failed to mark OTP as used in MySQL after Redis verification:', err);
            }

            return true;
          } else {
             // Invalid OTP in Redis. Do not fallback to MySQL because Redis has the *latest* OTP.
             return false;
          }
        }
      } catch (error) {
        console.error('[OTPService] Redis get failed, falling back to MySQL verification:', error);
      }
    }

    // 2. Fallback to MySQL if Redis is unavailable or key not found (maybe requested before update)
    const [rows]: any = await db.execute(
      `SELECT * FROM otp_codes 
       WHERE user_id = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, otp]
    );

    if (rows.length === 0) return false;

    await db.execute("UPDATE otp_codes SET is_used = TRUE WHERE id = ?", [rows[0].id]);
    return true;
  }
}

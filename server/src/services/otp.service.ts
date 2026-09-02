import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import db from "../config/database.js";
import { redis } from "../config/redis.js";

/**
 * How many wrong codes one user may submit before the outstanding OTP is burned.
 *
 * A 6-digit code with unlimited guesses is a 10^6 search that only needs the
 * 10-minute window; the per-IP limiter was the only thing slowing it down, and
 * an attacker picks their own IPs. This counter is keyed on the user, so it
 * holds regardless of where the requests come from.
 */
const MAX_OTP_ATTEMPTS = 5;
const OTP_TTL_SECONDS = 10 * 60;

export interface OTPVerifyResult {
  valid: boolean;
  /** True when the code was burned for too many wrong guesses — the user must request a new one. */
  lockedOut?: boolean;
}

export class OTPService {
  static generateOTP(): string {
    // Use cryptographically secure random number generation
    return crypto.randomInt(100000, 999999).toString();
  }

  private static attemptsKey(userId: string): string {
    return `otp:attempts:${userId}`;
  }

  /**
   * Count one wrong guess and report the running total for this user.
   *
   * Redis is authoritative when available. The MySQL column is the fallback for
   * the same reason the codes themselves are dual-written: the limit must still
   * apply when Redis is unreachable, which is exactly when an attacker would
   * most like it not to.
   */
  private static async registerFailedAttempt(userId: string): Promise<number> {
    if (redis) {
      try {
        const count = await redis.incr(this.attemptsKey(userId));
        if (count === 1) {
          await redis.expire(this.attemptsKey(userId), OTP_TTL_SECONDS);
        }
        return count;
      } catch (error) {
        console.error('[OTPService] Redis attempt counter failed, falling back to MySQL:', error);
      }
    }

    try {
      await db.execute(
        `UPDATE otp_codes SET attempts = attempts + 1
         WHERE user_id = ? AND is_used = FALSE AND expires_at > NOW()`,
        [userId]
      );
      const [rows]: any = await db.execute(
        `SELECT MAX(attempts) AS attempts FROM otp_codes
         WHERE user_id = ? AND is_used = FALSE AND expires_at > NOW()`,
        [userId]
      );
      return Number(rows[0]?.attempts || 0);
    } catch (error) {
      console.error('[OTPService] MySQL attempt counter failed:', error);
      // Fail closed: an uncountable attempt is treated as the last one allowed,
      // so a broken counter cannot become an unlimited guessing budget.
      return MAX_OTP_ATTEMPTS;
    }
  }

  /** Burn every outstanding code for this user, in both stores. */
  private static async invalidateOutstanding(userId: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(`otp:${userId}`);
      } catch (error) {
        console.error('[OTPService] Redis invalidate failed:', error);
      }
    }
    try {
      await db.execute(
        'UPDATE otp_codes SET is_used = TRUE WHERE user_id = ? AND is_used = FALSE',
        [userId]
      );
    } catch (error) {
      console.error('[OTPService] MySQL invalidate failed:', error);
    }
  }

  private static async resetAttempts(userId: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(this.attemptsKey(userId));
      } catch (error) {
        console.error('[OTPService] Redis attempt reset failed:', error);
      }
    }
  }

  static async createOTP(userId: string): Promise<string> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    // A newly issued code starts with a clean budget. The MySQL side needs no
    // reset — the counter lives on the row, and this is a new row.
    await this.resetAttempts(userId);

    // 1. Write to Redis (if configured)
    if (redis) {
      try {
        await redis.setex(`otp:${userId}`, OTP_TTL_SECONDS, otp);
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

  static async verifyOTP(userId: string, otp: string): Promise<OTPVerifyResult> {
    // 1. Try to verify via Redis first
    if (redis) {
      try {
        const storedOtp = await redis.get(`otp:${userId}`);

        if (storedOtp) {
          // If found in Redis, check if it matches
          if (String(storedOtp) === otp) {
            // Success! Delete the key to prevent reuse
            await redis.del(`otp:${userId}`);
            await this.resetAttempts(userId);

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

            return { valid: true };
          }

          // Invalid OTP in Redis. Do not fallback to MySQL because Redis has the *latest* OTP.
          return await this.handleFailure(userId);
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

    if (rows.length === 0) {
      return await this.handleFailure(userId);
    }

    await db.execute("UPDATE otp_codes SET is_used = TRUE WHERE id = ?", [rows[0].id]);
    await this.resetAttempts(userId);
    return { valid: true };
  }

  /**
   * Record a wrong guess and, once the budget is spent, burn the outstanding
   * code. Getting a fresh one costs another OTP send, which is separately
   * rate-limited — so the search space resets instead of accumulating.
   */
  private static async handleFailure(userId: string): Promise<OTPVerifyResult> {
    const attempts = await this.registerFailedAttempt(userId);

    if (attempts >= MAX_OTP_ATTEMPTS) {
      await this.invalidateOutstanding(userId);
      console.warn(`[OTPService] Burned OTP for user ${userId} after ${attempts} failed attempts.`);
      return { valid: false, lockedOut: true };
    }

    return { valid: false };
  }
}

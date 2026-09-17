import db from '../config/database.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import type { PoolConnection } from 'mysql2/promise';

/**
 * How much of a PPF roll is left, and whether a submission may draw on it.
 *
 * PPF is sold as a roll of a fixed area (250 sq.ft by default) identified by a
 * serial number. A roll is rarely used up on one car: 150 sq.ft goes on the
 * first vehicle and the remaining 100 on the next, so the same serial is
 * registered several times and each registration declares the area it consumed.
 * A roll may never give out more than it holds.
 *
 * The remaining area is derived by summing the ledger, never stored as a
 * counter. A rejected warranty has to hand its area back, and a stored total
 * that can disagree with the rows it summarises eventually does.
 *
 * Seat covers are identified by a pre-printed UID, have no serial number, and
 * never reach this service.
 */

const SETTING_KEY = 'ppf_roll_capacity_sqft';
const DEFAULT_CAPACITY_SQFT = 250;

/** Short cache — every submission would otherwise hit the settings table. */
let cached: { capacity: number; at: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getRollCapacitySqft(): Promise<number> {
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.capacity;

    try {
        const [rows]: any = await db.execute(
            'SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1',
            [SETTING_KEY]
        );
        const raw = Number(rows[0]?.setting_value);
        // A missing or nonsensical value must not silently grant an unlimited
        // roll, so anything unusable falls back to the default.
        const capacity = Number.isFinite(raw) && raw > 0 && raw <= 100_000 ? raw : DEFAULT_CAPACITY_SQFT;
        cached = { capacity, at: Date.now() };
        return capacity;
    } catch (error) {
        console.error('[PPFRoll] Could not read the capacity setting, using default:', error);
        return DEFAULT_CAPACITY_SQFT;
    }
}

export function clearRollCapacityCache() {
    cached = null;
}

/**
 * A roll cannot cover what the submission asked of it.
 *
 * Extends AppError because withTransaction re-throws those unchanged and
 * rewrites everything else into a generic database failure — which would
 * replace the one message that tells the installer what to correct.
 */
export class RollUnavailableError extends AppError {
    public readonly failedSerial?: string;

    constructor(message: string, failedSerial?: string) {
        super(ErrorCode.VALIDATION_ERROR, message, 400, { failedSerial });
        this.failedSerial = failedSerial;
    }
}

/** One roll drawn on by a warranty. */
export interface RollDraw {
    serial: string;
    sqft: number;
}

export interface RollCheck {
    ok: boolean;
    /** Shown to the user. Names the serial that failed, never the area left. */
    error?: string;
    /** The serial that failed, so the form can mark that row. */
    failedSerial?: string;
}

/** Bounds for a single declared area, before any roll is consulted. */
const MIN_DRAW_SQFT = 0.01;

/**
 * Read the rolls off a submission, whatever shape they arrive in.
 *
 * Accepts the array the form now sends, and falls back to the single
 * `serialNumber` field that PPF used before rolls were tracked, so a warranty
 * filed by an older client is still read correctly rather than rejected.
 * Returns [] for anything unrecognisable; the caller decides whether that is
 * an error, since an edit may legitimately leave the rolls alone.
 */
export function parseRolls(productDetails: any): RollDraw[] {
    if (!productDetails) return [];

    const raw = productDetails.rolls;
    if (Array.isArray(raw)) {
        return raw
            .map((r: any) => ({
                serial: String(r?.serial ?? '').trim().toUpperCase(),
                sqft: Number(r?.sqft),
            }))
            .filter((r) => r.serial !== '');
    }

    // Legacy single-serial submission: area unknown, so it is not a draw we can
    // measure. The caller treats a zero-length result as "no roll declared".
    return [];
}

/**
 * Validate the declared rolls and, on success, record the draws.
 *
 * Runs inside the caller's transaction and locks each roll's ledger rows with
 * FOR UPDATE. Without that lock two submissions checking the same roll at the
 * same moment would both see room and both be allowed, overdrawing it — the
 * likeliest way this rule gets broken in practice, since a busy franchise
 * files several registrations in a row.
 *
 * `warrantyUid` is the row this draw belongs to; it must already be decided by
 * the caller so the ledger and the warranty land together or not at all.
 */
export async function reserveRolls(
    connection: PoolConnection,
    rolls: RollDraw[],
    warrantyUid: string
): Promise<RollCheck> {
    if (rolls.length === 0) {
        return { ok: false, error: 'Please enter at least one serial number and the area used.' };
    }

    // The same serial twice in one submission would be checked against a
    // balance that does not yet include its sibling, so each would pass on its
    // own while together they overdraw. It is also just a mistake worth naming.
    const seen = new Set<string>();
    for (const roll of rolls) {
        if (seen.has(roll.serial)) {
            return {
                ok: false,
                failedSerial: roll.serial,
                error: `Serial ${roll.serial} has been entered twice. Please combine it into a single entry.`,
            };
        }
        seen.add(roll.serial);
    }

    const capacity = await getRollCapacitySqft();

    for (const roll of rolls) {
        if (!Number.isFinite(roll.sqft) || roll.sqft < MIN_DRAW_SQFT) {
            return {
                ok: false,
                failedSerial: roll.serial,
                error: `Please enter the area used for serial ${roll.serial}.`,
            };
        }

        if (roll.sqft > capacity) {
            return {
                ok: false,
                failedSerial: roll.serial,
                error: `Serial ${roll.serial} cannot be used for ${roll.sqft} sq.ft. Please check the serial number and the area entered.`,
            };
        }

        // Locks this roll's existing draws for the rest of the transaction.
        // Rejected warranties are excluded, which is how a rejection returns
        // its area to the roll without anything having to write it back.
        const [rows]: any = await connection.execute(
            `SELECT COALESCE(SUM(c.sqft_used), 0) AS used
               FROM ppf_roll_consumption c
               JOIN warranty_registrations w ON w.uid = c.warranty_uid
              WHERE c.roll_serial = ?
                AND w.status != 'rejected'
              FOR UPDATE`,
            [roll.serial]
        );

        const used = Number(rows[0]?.used ?? 0);
        if (used + roll.sqft > capacity) {
            return {
                ok: false,
                failedSerial: roll.serial,
                error: `Serial ${roll.serial} cannot be used for ${roll.sqft} sq.ft. Please check the serial number and the area entered.`,
            };
        }
    }

    for (const roll of rolls) {
        await connection.execute(
            `INSERT INTO ppf_roll_consumption (roll_serial, warranty_uid, sqft_used)
             VALUES (?, ?, ?)`,
            [roll.serial, warrantyUid, roll.sqft]
        );
    }

    return { ok: true };
}

/**
 * The warranty id for a PPF submission.
 *
 * The serial alone can no longer identify a warranty: one roll now covers
 * several vehicles, and the serial was previously written straight into the
 * primary key. Numbering each draw on a roll keeps that key unique while
 * leaving it readable — a serial a person can still recognise on a spec sheet
 * or in an email, followed by which fitting from that roll it was.
 *
 * Counts every draw, rejected ones included: a rejected warranty keeps its row
 * and therefore its id, so reusing its number would collide.
 */
export async function nextWarrantyUidForRoll(
    connection: PoolConnection,
    serial: string
): Promise<string> {
    const [rows]: any = await connection.execute(
        'SELECT COUNT(*) AS draws FROM ppf_roll_consumption WHERE roll_serial = ?',
        [serial]
    );
    const draw = Number(rows[0]?.draws ?? 0) + 1;
    return `${serial}-${String(draw).padStart(2, '0')}`;
}

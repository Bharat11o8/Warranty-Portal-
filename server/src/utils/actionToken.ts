import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { isSessionToken } from '../middleware/auth.js';

/**
 * Single-purpose links handed to franchises — the invoice download in the
 * WhatsApp button, the verify/reject link in the franchise email.
 *
 * These used to be signed with JWT_SECRET itself, the same key as every login
 * session. That made one secret the whole security boundary: whoever held it
 * could mint any link *and* any admin session. Each purpose now signs with its
 * own key derived from JWT_SECRET, so an action token can never verify as a
 * session (or as a different action), and the session key signs sessions only.
 *
 * If you add a new kind of link, add a purpose here. Do not sign it with
 * JWT_SECRET directly, and do not give it `typ`, `id` or `role`.
 */
export type ActionPurpose = 'invoice' | 'warranty_vendor_action';

/**
 * Links already sitting in WhatsApp chats and inboxes were signed the old way.
 * Invoice links live 30 days and verify/reject links 7, so they are accepted
 * until this date and then this whole fallback can be deleted.
 */
const LEGACY_ACCEPTED_UNTIL = Date.parse('2026-11-15T00:00:00+05:30');

const purposeKey = (purpose: ActionPurpose): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');
    return crypto.createHmac('sha256', secret).update(`action-token:${purpose}`).digest('hex');
};

export function signActionToken(
    purpose: ActionPurpose,
    payload: Record<string, unknown>,
    expiresIn: string
): string {
    return jwt.sign(
        { ...payload, purpose },
        purposeKey(purpose),
        { expiresIn, algorithm: 'HS256' } as jwt.SignOptions
    );
}

/** Shape a pre-change token of this purpose had, so the legacy path accepts nothing else. */
const legacyShapeMatches = (purpose: ActionPurpose, d: any): boolean => {
    if (purpose === 'invoice') return d.purpose === 'invoice' && !!d.orderId;
    if (purpose === 'warranty_vendor_action') return d.purpose === undefined && !!d.warrantyId;
    return false;
};

/**
 * Returns the decoded payload, or null for anything invalid, expired, or
 * issued for a different purpose.
 */
export function verifyActionToken(purpose: ActionPurpose, token: string): any | null {
    try {
        const decoded: any = jwt.verify(token, purposeKey(purpose), { algorithms: ['HS256'] });
        return decoded?.purpose === purpose ? decoded : null;
    } catch {
        // fall through to the legacy check
    }

    if (Date.now() >= LEGACY_ACCEPTED_UNTIL) return null;

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string, { algorithms: ['HS256'] });
        if (!decoded || typeof decoded !== 'object') return null;
        if (isSessionToken(decoded)) return null;
        return legacyShapeMatches(purpose, decoded) ? decoded : null;
    } catch {
        return null;
    }
}

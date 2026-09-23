import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';
import { getIO } from '../socket.js';

/**
 * The numbers on the admin sidebar: how much work is waiting that nobody has
 * picked up yet.
 *
 * These are counts of state, not of unread notifications. A notification is
 * per admin and goes quiet once read, even if nobody acted on it; a grievance
 * still `submitted` or a POSM request still `open` is waiting whoever looks,
 * and stops counting the moment someone moves it on.
 */
export interface AttentionCounts {
    grievances?: number;
    posm?: number;
}

type Perms = Record<string, { read: boolean; write: boolean }> | undefined;

const canRead = (user: { isSuperAdmin?: boolean; permissions?: Perms }, module: string) =>
    !!user.isSuperAdmin || !!user.permissions?.[module]?.read;

/** Counts for the modules this admin can open; anything else is left out. */
export async function getAttentionCounts(user: { isSuperAdmin?: boolean; permissions?: Perms }): Promise<AttentionCounts> {
    const counts: AttentionCounts = {};

    if (canRead(user, 'grievances')) {
        const [rows]: any = await db.execute(
            "SELECT COUNT(*) AS n FROM grievances WHERE status = 'submitted'"
        );
        counts.grievances = Number(rows[0]?.n || 0);
    }

    if (canRead(user, 'posm')) {
        const [rows]: any = await db.execute(
            "SELECT COUNT(*) AS n FROM posm_requests WHERE status = 'open'"
        );
        counts.posm = Number(rows[0]?.n || 0);
    }

    return counts;
}

/**
 * Tell every connected admin the counts may have changed. The event carries no
 * numbers — each admin re-fetches, so an admin without POSM access never
 * receives the POSM figure.
 */
export function signalAdminAttention(): void {
    try {
        getIO().to('role_admin').emit('admin:attention');
    } catch {
        // Socket.io not initialised (scripts, tests). The sidebar also polls.
    }
}

/**
 * Route middleware: signal once the handler has answered with success. Put it
 * on any route that creates a grievance / POSM request or can change its
 * status, rather than threading a call through each controller's branches.
 */
export const signalAdminAttentionOnSuccess = (_req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) signalAdminAttention();
    });
    next();
};

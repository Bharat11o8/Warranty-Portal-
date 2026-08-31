import db from '../config/database.js';

/**
 * The analytics events ledger.
 *
 * The warranty trend chart counts `registered` rows here rather than in
 * warranty_registrations, so that a warranty's registration date stays fixed
 * on the timeline even as its status later changes.
 *
 * These used to be written by a middleware that ran on every analytics page
 * load. That was removed in August so reads would stay read-only, but nothing
 * replaced it — the ledger simply stopped gaining rows, and the chart's total
 * line read zero for 888 warranties while every other line kept working.
 *
 * Writing the event where the warranty is created removes the dependence on
 * anyone opening a page.
 */

/**
 * Record that a warranty was registered.
 *
 * Never throws: analytics must not be able to fail a registration. A missing
 * event is recoverable later by `repairMissingEvents`; a failed registration
 * is not.
 */
export async function recordRegistrationEvent(
    warrantyDbId: number | string,
    performedBy: string | null
): Promise<void> {
    try {
        await db.execute(
            `INSERT INTO analytics_events (warranty_id, action_type, performed_by, created_at)
             SELECT ?, 'registered', ?, NOW()
             FROM DUAL
             WHERE NOT EXISTS (
                 SELECT 1 FROM analytics_events
                 WHERE warranty_id = ? AND action_type = 'registered'
             )`,
            [warrantyDbId, performedBy || 'customer', warrantyDbId]
        );
    } catch (error: any) {
        console.error('[Analytics] Could not record the registration event:', error?.message || error);
    }
}

export interface RepairResult {
    registered: number;
    validated: number;
    vendor_approved: number;
    rejected: number;
}

/**
 * Fill in events for warranties that have none.
 *
 * Idempotent — it only inserts where an event is absent, so running it twice
 * changes nothing. Kept as a safety net for any gap that opens despite the
 * write above, and used by the POST /analytics/sync endpoint.
 */
export async function repairMissingEvents(): Promise<RepairResult> {
    const result: RepairResult = { registered: 0, validated: 0, vendor_approved: 0, rejected: 0 };

    const jobs: [keyof RepairResult, string][] = [
        ['registered', `
            INSERT INTO analytics_events (warranty_id, action_type, performed_by, created_at)
            SELECT wr.id, 'registered', wr.customer_name, wr.created_at
            FROM warranty_registrations wr
            LEFT JOIN analytics_events ae
              ON ae.warranty_id = wr.id AND ae.action_type = 'registered'
            WHERE ae.id IS NULL`],
        ['validated', `
            INSERT INTO analytics_events (warranty_id, action_type, performed_by, created_at)
            SELECT wr.id, 'validated', 'system_admin', COALESCE(wr.validated_at, wr.created_at)
            FROM warranty_registrations wr
            LEFT JOIN analytics_events ae
              ON ae.warranty_id = wr.id AND ae.action_type = 'validated'
            WHERE ae.id IS NULL AND wr.status = 'validated'`],
        ['vendor_approved', `
            INSERT INTO analytics_events (warranty_id, action_type, performed_by, created_at)
            SELECT wr.id, 'vendor_approved', COALESCE(wr.installer_name, 'Unknown Vendor'),
                   COALESCE(wr.vendor_approved_at, wr.created_at)
            FROM warranty_registrations wr
            LEFT JOIN analytics_events ae
              ON ae.warranty_id = wr.id AND ae.action_type = 'vendor_approved'
            WHERE ae.id IS NULL AND wr.vendor_approved_at IS NOT NULL`],
        ['rejected', `
            INSERT INTO analytics_events (warranty_id, action_type, performed_by, created_at)
            SELECT wr.id, 'rejected', 'system_admin', COALESCE(wr.rejected_at, wr.created_at)
            FROM warranty_registrations wr
            LEFT JOIN analytics_events ae
              ON ae.warranty_id = wr.id AND ae.action_type = 'rejected'
            WHERE ae.id IS NULL AND wr.status = 'rejected'`],
    ];

    for (const [kind, sql] of jobs) {
        try {
            const [r]: any = await db.execute(sql);
            result[kind] = r.affectedRows || 0;
        } catch (error: any) {
            console.error(`[Analytics] Repair failed for ${kind}:`, error?.message || error);
        }
    }

    const total = Object.values(result).reduce((a, b) => a + b, 0);
    if (total > 0) {
        console.log('[Analytics] Repaired missing events:', result);
    }
    return result;
}

/**
 * Run the repair periodically.
 *
 * A backstop, not the primary writer — the event is written at registration
 * time. This exists so a gap caused by a failed write, a crash mid-request, or
 * a row inserted by some future path is closed within the hour rather than
 * waiting for someone to notice a wrong chart.
 */
export function startAnalyticsRepairSchedule(intervalMs = 60 * 60 * 1000) {
    // One pass at startup catches anything missed while the process was down.
    setTimeout(() => { void repairMissingEvents(); }, 30_000);

    const timer = setInterval(() => { void repairMissingEvents(); }, intervalMs);
    // Do not hold the process open on shutdown.
    timer.unref?.();
    return timer;
}

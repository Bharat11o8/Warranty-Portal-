/**
 * The month view of store audits.
 *
 * A month holds however many campaigns were sent in it, and the same store is
 * chased across several of them — all 319 stores in September's reminder had
 * already been targeted by the first campaign. Read round by round that store
 * appears twice, once as outstanding and once as done, which is no use to an
 * admin working through a call list.
 *
 * So the month is the unit of compliance and the round is the detail: a store
 * is counted once, is "done" if it answered in ANY round of that month, and
 * carries the rounds it was reached through as context for the person calling.
 */
import db from '../config/database.js';

/** A round belongs to the month it was SENT in, not the month replies arrive. */
const MONTH_OF_ROUND = `DATE_FORMAT(COALESCE(r.first_sent_at, r.created_at), '%Y-%m')`;

/**
 * Only campaigns an admin has ticked.
 *
 * Interakt sends plenty that are nothing to do with auditing — a scheme
 * announcement opened a round here with no targets. Rather than guess from the
 * template name, nothing counts until someone says it counts.
 */
const COUNTED = `r.include_in_stats = 1`;

export interface MonthSummary {
    month: string;
    rounds: number;
    stores: number;
    done: number;
    outstanding: number;
    compliance: number;
}

/**
 * Months that have any audit campaign at all, newest first.
 *
 * Deliberately not restricted to counted campaigns: a month whose campaigns
 * are all unticked would vanish from the picker, taking the control that
 * unticks them with it, and the screen would read "no campaigns yet" while
 * holding hundreds of stores. The month appears; its totals count only what
 * has been ticked.
 */
export async function listMonths(): Promise<MonthSummary[]> {
    /*
     * A phone audit has no round, so counting replies alone understates the
     * month — a store closed out by calling it stayed on the outstanding total
     * while correctly leaving the list underneath. Both halves are counted
     * here, matched on the last ten digits because one side stores a phone_key
     * and the other whatever the auditor typed.
     */
    const [rows]: any = await db.query(
        `SELECT ${MONTH_OF_ROUND} AS month,
                COUNT(DISTINCT CASE WHEN r.include_in_stats = 1 THEN r.id END) AS rounds,
                COUNT(DISTINCT t.phone_key) AS stores,
                COUNT(DISTINCT CASE
                        WHEN t.responded_at IS NOT NULL THEN t.phone_key
                        WHEN EXISTS (
                            SELECT 1 FROM store_audits sa
                             WHERE sa.round_id IS NULL
                               AND sa.audit_month = ${MONTH_OF_ROUND}
                               AND RIGHT(REGEXP_REPLACE(sa.submitted_phone, '[^0-9]', ''), 10)
                                   = RIGHT(t.phone_key, 10)
                        ) THEN t.phone_key
                      END) AS done
           FROM audit_rounds r
           LEFT JOIN audit_round_targets t
                  ON t.round_id = r.id AND ${COUNTED}
          GROUP BY month
          ORDER BY month DESC`
    );
    return rows.map((r: any) => {
        const stores = Number(r.stores) || 0;
        const done = Number(r.done) || 0;
        return {
            month: r.month,
            rounds: Number(r.rounds) || 0,
            stores,
            done,
            outstanding: stores - done,
            compliance: stores ? Number(((done / stores) * 100).toFixed(1)) : 0,
        };
    });
}

/** The rounds inside one month, in the order they went out. */
export async function roundsInMonth(month: string) {
    const [rows]: any = await db.query(
        `SELECT r.id, r.name, r.campaign_name, r.campaign_id, r.status,
                r.first_sent_at, r.include_in_stats,
                (SELECT COUNT(*) FROM audit_round_targets t WHERE t.round_id = r.id) AS targets,
                (SELECT COUNT(*) FROM audit_round_targets t
                  WHERE t.round_id = r.id AND t.responded_at IS NOT NULL) AS responded
           FROM audit_rounds r
          WHERE ${MONTH_OF_ROUND} = ?
          ORDER BY COALESCE(r.first_sent_at, r.created_at) ASC`,
        [month]
    );
    return rows;
}

/**
 * Every campaign of a month, counted or not, so an admin can tick the ones
 * that are audits. Without this the excluded ones are invisible and there is
 * no way to correct a wrong call.
 */
export async function allCampaignsInMonth(month: string) {
    const [rows]: any = await db.query(
        `SELECT r.id, r.name, r.campaign_name, r.template_name, r.include_in_stats,
                r.first_sent_at,
                (SELECT COUNT(*) FROM audit_round_targets t WHERE t.round_id = r.id) AS targets
           FROM audit_rounds r
          WHERE ${MONTH_OF_ROUND} = ?
          ORDER BY COALESCE(r.first_sent_at, r.created_at) ASC`,
        [month]
    );
    return rows;
}

/**
 * One row per store for the month, deduplicated across rounds.
 *
 * Grouped on phone_key rather than vendor_details_id: a third of the uploaded
 * contacts never matched a franchise record, and dropping them would hide real
 * stores from the call list.
 */
export async function storesInMonth(month: string, opts: { status?: string } = {}) {
    const [rows]: any = await db.query(
        /*
         * The column names match the round-wise chase list exactly, so the same
         * table renders both views — a store the admin calls should not look
         * different depending on which screen it was opened from.
         */
        `SELECT
             MIN(t.id)                                  AS id,
             t.phone_key,
             MAX(COALESCE(vd.store_name, c.store_name)) AS store_name,
             MAX(vd.store_code)                         AS store_code,
             MAX(COALESCE(p.name, c.contact_person))    AS contact_person,
             MAX(COALESCE(vd.city, c.city))             AS city,
             MAX(COALESCE(vd.state, c.state))           AS state,
             MAX(COALESCE(c.asm, ''))                   AS asm,
             MAX(COALESCE(p.phone_number, t.phone_key, c.raw_phone)) AS phone_number,
             MAX(t.sent_phone)                          AS sent_phone,
             MAX(t.vendor_details_id)                   AS vendor_details_id,
             MAX(t.store_audit_id)                      AS store_audit_id,
             -- The FIRST time it went out this month, not the latest chase.
             MIN(t.sent_at)                             AS sent_at,
             COUNT(DISTINCT t.round_id)                 AS rounds_sent,
             GROUP_CONCAT(DISTINCT r.name ORDER BY r.first_sent_at SEPARATOR ', ') AS round_names,
             SUM(t.responded_at IS NOT NULL) > 0        AS done,
             MAX(t.responded_at)                        AS responded_at,
             MAX(t.read_at)                             AS read_at,
             MAX(t.delivered_at)                        AS delivered_at
           FROM audit_round_targets t
           JOIN audit_rounds r ON r.id = t.round_id
           LEFT JOIN audit_contacts c ON c.phone_key = t.phone_key
           LEFT JOIN vendor_details vd ON vd.id = t.vendor_details_id
           LEFT JOIN profiles p ON p.id = vd.user_id
          WHERE ${MONTH_OF_ROUND} = ? AND ${COUNTED}
          GROUP BY t.phone_key
          ORDER BY done ASC, store_name ASC`,
        [month]
    );

    /*
     * A manual audit belongs to the month, not to a round, so it cannot be
     * found by the join above. Folded in here: a store called and audited by
     * hand is done, whatever WhatsApp reports.
     */
    const [manual]: any = await db.query(
        `SELECT submitted_phone, MAX(created_at_ts) AS at FROM (
            SELECT submitted_phone,
                   COALESCE(STR_TO_DATE(audit_date, '%Y-%m-%d'), NOW()) AS created_at_ts
              FROM store_audits
             WHERE audit_month = ? AND round_id IS NULL
         ) x GROUP BY submitted_phone`,
        [month]
    );
    const manualBy = new Map<string, any>();
    for (const m of manual) {
        const key = String(m.submitted_phone || '').replace(/\D/g, '').slice(-10);
        if (key) manualBy.set(key, m.at);
    }

    const list = rows.map((r: any) => {
        const manualAt = manualBy.get(String(r.phone_key || '').slice(-10));
        const done = Boolean(Number(r.done)) || Boolean(manualAt);
        return {
            ...r,
            done,
            done_by: Number(r.done) ? 'whatsapp' : manualAt ? 'call' : null,
            manual_at: manualAt || null,
            rounds_sent: Number(r.rounds_sent) || 0,
        };
    });

    if (opts.status === 'outstanding') return list.filter((s: any) => !s.done);
    if (opts.status === 'done') return list.filter((s: any) => s.done);
    return list;
}

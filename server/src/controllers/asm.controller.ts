import { Request, Response } from 'express';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { routeEnquiry, areaKey } from '../services/asmRouting.service.js';
import { findState } from '../services/indianStates.js';
import { ActivityLogService } from '../services/activity-log.service.js';

export class AsmController {
    /**
     * Called by the Interakt workflow when a customer has given their area.
     *
     * Returns the matched ASM so the workflow can name them in its own closing
     * message. That message is then an ordinary reply inside the 24-hour window
     * rather than a paid template — the reason this answers synchronously
     * instead of acknowledging first.
     *
     * Interakt requires a 200 within three seconds and disables the webhook
     * after five failures in ten minutes, so the whole thing is raced against a
     * 2.2s timer: a slow WhatsApp send loses the ASM's name in the reply, but
     * never costs us the webhook. Routing continues regardless.
     */
    static async routeEnquiryWebhook(req: Request, res: Response) {
        const { area, phone, name, product, car, source, flow_id, fallbackArea, dryRun } = req.body || {};

        if (!phone || !area) {
            return res.status(400).json({ error: 'phone and area are required' });
        }

        const routing = routeEnquiry({
            area: String(area),
            phone: String(phone),
            name: name ? String(name) : null,
            product: product ? String(product) : null,
            car: car ? String(car) : null,
            source: source ? String(source) : 'whatsapp',
            flowId: flow_id ? String(flow_id) : null,
            fallbackArea: fallbackArea ? String(fallbackArea) : null,
            dryRun: dryRun === true,
            rawPayload: req.body,
        });

        // Keep routing alive even if the race below gives up on it.
        routing.catch(err => console.error('[ASM] routing failed:', err?.message));

        const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 2200));
        const result = await Promise.race([routing.catch(() => null), timeout]);

        /*
         * Always answer with the same keys. Interakt's Save Response maps fields
         * by name, so a missing key would leave a variable unset and print an
         * empty gap in the customer's message.
         */
        res.json({
            received: true,
            matched: Boolean(result?.asm),
            // 'sent' | 'duplicate' | 'unmatched' | 'failed' | 'dry-run', or
            // empty when routing outran the timer and the reply went without it.
            status: result?.status || '',
            asm_name: result?.asm?.name || '',
            asm_phone: result?.asm?.phone_number || '',
            area: result?.matchedArea || String(area),
            product: result?.product || '',
            car: result?.car || '',
        });
    }

    // ── ASMs ────────────────────────────────────────────────────────────────

    static async listAsms(_req: Request, res: Response) {
        try {
            const [rows]: any = await db.execute(
                `SELECT a.*,
                        (SELECT COUNT(*) FROM asm_areas ar WHERE ar.asm_id = a.id) AS area_count,
                        (SELECT COUNT(*) FROM leads l WHERE l.asm_id = a.id) AS lead_count
                   FROM asms a
                  ORDER BY a.is_active DESC, a.name ASC`
            );
            const [areas]: any = await db.execute(
                'SELECT id, asm_id, area_key, area_label, state FROM asm_areas ORDER BY area_label'
            );
            res.json({ success: true, asms: rows, areas });
        } catch (error: any) {
            console.error('List ASMs error:', error);
            res.status(500).json({ error: 'Failed to load ASMs' });
        }
    }

    static async createAsm(req: Request, res: Response) {
        try {
            const { name, phone_number, email } = req.body || {};
            if (!name || !phone_number) {
                return res.status(400).json({ error: 'Name and WhatsApp number are required' });
            }
            const id = uuidv4();
            await db.execute(
                'INSERT INTO asms (id, name, phone_number, email) VALUES (?, ?, ?, ?)',
                [id, String(name).trim(), String(phone_number).replace(/\D/g, ''), email || null]
            );
            res.status(201).json({ success: true, id, message: 'ASM added' });
        } catch (error: any) {
            if (error?.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'That WhatsApp number already belongs to another ASM' });
            }
            console.error('Create ASM error:', error);
            res.status(500).json({ error: 'Failed to add ASM' });
        }
    }

    static async updateAsm(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, phone_number, email, is_active } = req.body || {};
            const [rows]: any = await db.execute('SELECT id FROM asms WHERE id = ?', [id]);
            if (!rows.length) return res.status(404).json({ error: 'ASM not found' });

            await db.execute(
                `UPDATE asms SET
                    name = COALESCE(?, name),
                    phone_number = COALESCE(?, phone_number),
                    email = ?,
                    is_active = COALESCE(?, is_active)
                  WHERE id = ?`,
                [
                    name ? String(name).trim() : null,
                    phone_number ? String(phone_number).replace(/\D/g, '') : null,
                    email ?? null,
                    is_active === undefined ? null : (is_active ? 1 : 0),
                    id,
                ]
            );
            res.json({ success: true, message: 'ASM updated' });
        } catch (error: any) {
            if (error?.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'That WhatsApp number already belongs to another ASM' });
            }
            console.error('Update ASM error:', error);
            res.status(500).json({ error: 'Failed to update ASM' });
        }
    }

    static async deleteAsm(req: Request, res: Response) {
        try {
            const { id } = req.params;
            // Areas cascade; leads keep asm_id so history survives the deletion.
            const [r]: any = await db.execute('DELETE FROM asms WHERE id = ?', [id]);
            if (!r.affectedRows) return res.status(404).json({ error: 'ASM not found' });
            res.json({ success: true, message: 'ASM removed' });
        } catch (error: any) {
            console.error('Delete ASM error:', error);
            res.status(500).json({ error: 'Failed to remove ASM' });
        }
    }

    // ── Areas ───────────────────────────────────────────────────────────────

    /**
     * Assign an area to an ASM.
     *
     * area_key is UNIQUE, so a second ASM claiming the same place is refused by
     * the database rather than resolved arbitrarily at routing time.
     */
    static async addArea(req: Request, res: Response) {
        try {
            const { asm_id, area_label, state } = req.body || {};
            if (!asm_id || !area_label) {
                return res.status(400).json({ error: 'asm_id and area_label are required' });
            }
            const key = areaKey(area_label);
            if (!key) return res.status(400).json({ error: 'That area name is empty once normalised' });

            const [asm]: any = await db.execute('SELECT id FROM asms WHERE id = ?', [asm_id]);
            if (!asm.length) return res.status(404).json({ error: 'ASM not found' });

            await db.execute(
                'INSERT INTO asm_areas (id, asm_id, area_key, area_label, state) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), asm_id, key, String(area_label).trim(), state || null]
            );
            res.status(201).json({ success: true, message: `${area_label} assigned` });
        } catch (error: any) {
            if (error?.code === 'ER_DUP_ENTRY') {
                const [owner]: any = await db.execute(
                    `SELECT a.name FROM asm_areas ar JOIN asms a ON a.id = ar.asm_id WHERE ar.area_key = ?`,
                    [areaKey(req.body?.area_label || '')]
                );
                return res.status(400).json({
                    error: owner.length
                        ? `That area is already covered by ${owner[0].name}`
                        : 'That area is already assigned',
                });
            }
            console.error('Add area error:', error);
            res.status(500).json({ error: 'Failed to assign the area' });
        }
    }

    static async removeArea(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const [r]: any = await db.execute('DELETE FROM asm_areas WHERE id = ?', [id]);
            if (!r.affectedRows) return res.status(404).json({ error: 'Area not found' });
            res.json({ success: true, message: 'Area removed' });
        } catch (error: any) {
            console.error('Remove area error:', error);
            res.status(500).json({ error: 'Failed to remove the area' });
        }
    }

    /** Cities we already serve — suggestions, so nobody types an area from memory. */
    static async knownAreas(_req: Request, res: Response) {
        try {
            const [rows]: any = await db.execute(
                `SELECT DISTINCT city AS label, state
                   FROM vendor_details
                  WHERE city IS NOT NULL AND TRIM(city) <> ''
                  ORDER BY city`
            );
            res.json({ success: true, areas: rows });
        } catch (error: any) {
            console.error('Known areas error:', error);
            res.status(500).json({ error: 'Failed to load areas' });
        }
    }

    // ── Leads (phase 2 reads this) ──────────────────────────────────────────

    /**
     * Add a lead by hand.
     *
     * IVR and website enquiries reach us by phone or a form, not a webhook, so
     * somebody has to enter them. They then travel the same path as an
     * automatic one — matched to a state, sent to that ASM, capped by the same
     * daily limit — because a lead is a lead whatever door it came through.
     *
     * This sends a real WhatsApp to a real person. `preview` exists so the form
     * can show who it is about to reach before anything is sent.
     */
    static async createLead(req: Request, res: Response) {
        try {
            const { name, phone, area, product, car, source, preview } = req.body || {};
            const admin = (req as any).user;

            if (!phone || !area) {
                return res.status(400).json({ error: 'Phone number and area are required' });
            }
            const digits = String(phone).replace(/\D/g, '');
            if (digits.length < 10) {
                return res.status(400).json({ error: 'That phone number does not look complete' });
            }

            // Only the manual channels: an entry claiming to be from WhatsApp
            // or Instagram would be indistinguishable from a real one.
            const channel = source === 'website' ? 'website' : 'ivr';

            /*
             * A preview resolves and reports without sending. Mistyping an area
             * here costs a real message to a real ASM, and that cannot be
             * recalled, so the form is expected to show the match first.
             */
            if (preview === true) {
                const result = await routeEnquiry({
                    area: String(area),
                    phone: digits,
                    name: name ? String(name) : null,
                    product: product ? String(product) : null,
                    car: car ? String(car) : null,
                    source: channel,
                    dryRun: true,
                });
                return res.json({
                    success: true,
                    preview: true,
                    state: findState(String(area))?.state || null,
                    matched: Boolean(result.asm),
                    asm_name: result.asm?.name || null,
                    asm_phone: result.asm?.phone_number || null,
                    status: result.status,
                });
            }

            const result = await routeEnquiry({
                area: String(area),
                phone: digits,
                name: name ? String(name) : null,
                product: product ? String(product) : null,
                car: car ? String(car) : null,
                source: channel,
                rawPayload: { entered_by: admin?.email || admin?.id, channel },
            });

            try {
                await ActivityLogService.log({
                    adminId: admin?.id,
                    adminName: admin?.name,
                    adminEmail: admin?.email,
                    actionType: 'LEAD_CREATED',
                    targetType: 'LEAD',
                    targetId: result.leadId,
                    targetName: name ? String(name) : digits,
                    details: {
                        channel,
                        area: String(area),
                        status: result.status,
                        asm: result.asm?.name || null,
                    },
                    ipAddress: req.ip || req.socket?.remoteAddress,
                });
            } catch (e) {
                console.error('Failed to log lead creation', e);
            }

            res.status(201).json({
                success: true,
                id: result.leadId,
                status: result.status,
                asm_name: result.asm?.name || null,
                message: result.asm
                    ? `Lead added and forwarded to ${result.asm.name}`
                    : 'Lead added, but no ASM covers that area yet',
            });
        } catch (error: any) {
            console.error('Create lead error:', error);
            res.status(500).json({ error: 'Failed to add the lead' });
        }
    }

    /**
     * Edit a lead: the outcome, the audit, and corrections to what was captured.
     *
     * Two outcomes are tracked separately and deliberately. `lead_status` is
     * what the ASM reported; `review_status` is what an admin found calling the
     * customer back. Where the two disagree is the whole point of auditing, so
     * neither may overwrite the other.
     */
    static async updateLead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const admin = (req as any).user;
            const {
                lead_status, review_status, review_reason,
                customer_name, raw_area, state, product, car_model,
            } = req.body || {};

            const [rows]: any = await db.execute('SELECT id FROM leads WHERE id = ?', [id]);
            if (!rows.length) return res.status(404).json({ error: 'Lead not found' });

            const OUTCOMES = [
                'no_response', 'follow_up', 'closed_won', 'closed_lost',
                'call_disconnected', 'switched_off', 'number_not_working',
            ];
            for (const [field, value] of [
                ['lead_status', lead_status],
                ['review_status', review_status],
            ] as Array<[string, any]>) {
                if (value !== undefined && value !== null && value !== ''
                    && !OUTCOMES.includes(String(value))) {
                    return res.status(400).json({ error: `${field} is not one of the allowed outcomes` });
                }
            }

            const sets: string[] = [];
            const params: any[] = [];
            const assign = (col: string, value: any, transform: (v: any) => any = v => v) => {
                if (value === undefined) return;
                sets.push(`${col} = ?`);
                params.push(value === '' || value === null ? null : transform(value));
            };

            assign('lead_status', lead_status);
            assign('review_status', review_status);
            assign('review_reason', review_reason, v => String(v).slice(0, 500));
            assign('customer_name', customer_name, v => String(v).trim());
            assign('raw_area', raw_area, v => String(v).trim());
            assign('product', product);
            assign('car_model', car_model, v => String(v).trim().slice(0, 80));

            /*
             * Correcting the area re-resolves the state, unless one was given
             * explicitly — the resolver reads most spellings, but an admin who
             * knows better should be able to say so.
             */
            if (state !== undefined) {
                assign('state', state, v => String(v).trim());
            } else if (raw_area !== undefined) {
                sets.push('state = ?');
                params.push(findState(String(raw_area))?.state || null);
            }

            // Stamp the audit only when the review itself changed.
            if (review_status !== undefined || review_reason !== undefined) {
                sets.push('reviewed_at = NOW()', 'reviewed_by = ?');
                params.push(admin?.id || null);
            }

            if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

            await db.execute(`UPDATE leads SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);

            try {
                await ActivityLogService.log({
                    adminId: admin?.id,
                    adminName: admin?.name,
                    adminEmail: admin?.email,
                    actionType: 'LEAD_UPDATED',
                    targetType: 'LEAD',
                    targetId: id,
                    targetName: customer_name ? String(customer_name) : id,
                    details: {
                        lead_status: lead_status ?? null,
                        review_status: review_status ?? null,
                        review_reason: review_reason ?? null,
                    },
                    ipAddress: req.ip || req.socket?.remoteAddress,
                });
            } catch (e) {
                console.error('Failed to log lead update', e);
            }

            res.json({ success: true, message: 'Lead updated' });
        } catch (error: any) {
            console.error('Update lead error:', error);
            res.status(500).json({ error: 'Failed to update the lead' });
        }
    }

    static async listLeads(req: Request, res: Response) {
        try {
            const { status, source, asm_id, product, delivery, dateFrom, dateTo, q, limit } =
                req.query as Record<string, string>;
            const where: string[] = [];
            const params: any[] = [];
            if (status) { where.push('l.status = ?'); params.push(status); }
            if (source) { where.push('l.source = ?'); params.push(source); }
            if (asm_id) { where.push('l.asm_id = ?'); params.push(asm_id); }
            if (product) { where.push('l.product = ?'); params.push(product); }

            /*
             * The date range, compared in IST rather than UTC.
             *
             * created_at is stored UTC, so an enquiry at 1am IST falls on the
             * previous day once compared raw — and a day filter that silently
             * drops the first five and a half hours of every day is worse than
             * no filter. Both bounds are inclusive, which is what a person
             * picking two dates means.
             */
            if (dateFrom) {
                where.push("DATE(CONVERT_TZ(l.created_at, '+00:00', '+05:30')) >= ?");
                params.push(dateFrom);
            }
            if (dateTo) {
                where.push("DATE(CONVERT_TZ(l.created_at, '+00:00', '+05:30')) <= ?");
                params.push(dateTo);
            }

            /*
             * Filtering on how far the ASM's message got.
             *
             * The status itself is computed in the SELECT, so it cannot be named
             * in a WHERE clause — this repeats the match as an EXISTS instead.
             * 'none' is its own case: a lead with no message at all is an
             * unmatched, duplicate or throttled one, which is a different
             * question from "was it delivered".
             */
            if (delivery) {
                const matchWindow = `
                    ml.context = 'asm_enquiry'
                AND ml.reference_id COLLATE utf8mb4_0900_ai_ci = l.customer_phone
                AND ABS(TIMESTAMPDIFF(SECOND, l.sent_at, ml.created_at)) <= 15`;

                if (delivery === 'none') {
                    where.push(`NOT EXISTS (SELECT 1 FROM message_logs ml WHERE ${matchWindow})`);
                } else {
                    where.push(`EXISTS (
                        SELECT 1 FROM message_logs ml
                         WHERE ${matchWindow} AND ml.status = ?
                    )`);
                    params.push(delivery);
                }
            }
            if (q) {
                where.push('(l.customer_phone LIKE ? OR l.customer_name LIKE ? OR l.raw_area LIKE ? OR l.car_model LIKE ?)');
                const like = `%${q}%`;
                params.push(like, like, like, like);
            }

            const [rows]: any = await db.execute(
                `SELECT l.*, a.name AS asm_name, a.phone_number AS asm_phone,
                        /*
                         * Whether the ASM's WhatsApp actually arrived, and
                         * whether they opened it. Interakt's delivery webhook
                         * already keeps message_logs current — 'sent' only
                         * means we handed it over, which is the weakest of the
                         * three things worth knowing.
                         *
                         * Matched on recipient and time rather than a stored
                         * message id: capturing the id would mean changing what
                         * the shared WhatsApp service returns, and every
                         * template in the system goes through it. A correlated
                         * subquery cannot duplicate a lead row, and takes the
                         * nearest message inside fifteen seconds so a repeat
                         * enquiry from the same number cannot claim the wrong
                         * one. The collation cast is needed because the two
                         * tables were created with different defaults.
                         */
                        (SELECT ml.status FROM message_logs ml
                          WHERE ml.context = 'asm_enquiry'
                            AND ml.reference_id COLLATE utf8mb4_0900_ai_ci = l.customer_phone
                            AND ABS(TIMESTAMPDIFF(SECOND, l.sent_at, ml.created_at)) <= 15
                          ORDER BY ABS(TIMESTAMPDIFF(SECOND, l.sent_at, ml.created_at))
                          LIMIT 1) AS delivery_status,
                        (SELECT ml.updated_at FROM message_logs ml
                          WHERE ml.context = 'asm_enquiry'
                            AND ml.reference_id COLLATE utf8mb4_0900_ai_ci = l.customer_phone
                            AND ABS(TIMESTAMPDIFF(SECOND, l.sent_at, ml.created_at)) <= 15
                          ORDER BY ABS(TIMESTAMPDIFF(SECOND, l.sent_at, ml.created_at))
                          LIMIT 1) AS delivery_updated_at
                   FROM leads l
                   LEFT JOIN asms a ON a.id = l.asm_id
                   ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                  ORDER BY l.created_at DESC
                  LIMIT ${Math.min(Number(limit) || 200, 1000)}`,
                params
            );
            /*
             * The summary follows the date range, and nothing else.
             *
             * The tiles ARE the status filter, so narrowing them by status
             * would leave every tile but the selected one reading zero. A date
             * range is different: it is the period being looked at, and totals
             * for all time beside a list showing one week is a contradiction
             * somebody will eventually act on.
             */
            const countWhere: string[] = [];
            const countParams: any[] = [];
            if (dateFrom) {
                countWhere.push("DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) >= ?");
                countParams.push(dateFrom);
            }
            if (dateTo) {
                countWhere.push("DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) <= ?");
                countParams.push(dateTo);
            }

            const [[counts]]: any = await db.execute(
                /*
                 * COALESCE because SUM over no rows is NULL, not 0 — a date
                 * range matching nothing would otherwise hand the UI a row of
                 * nulls where it expects numbers.
                 */
                `SELECT COUNT(*) total,
                        COALESCE(SUM(status = 'sent'), 0) sent,
                        COALESCE(SUM(status = 'failed'), 0) failed,
                        COALESCE(SUM(status = 'unmatched'), 0) unmatched,
                        COALESCE(SUM(product = 'Seat Covers'), 0) seat_covers,
                        COALESCE(SUM(product = 'Mats'), 0) mats,
                        COALESCE(SUM(product = 'Accessories'), 0) accessories,
                        COALESCE(SUM(product IS NULL), 0) no_product,
                        COALESCE(SUM(source = 'whatsapp'), 0) ch_whatsapp,
                        COALESCE(SUM(source = 'instagram'), 0) ch_instagram,
                        COALESCE(SUM(source = 'ivr'), 0) ch_ivr,
                        COALESCE(SUM(source = 'website'), 0) ch_website
                   FROM leads
                   ${countWhere.length ? 'WHERE ' + countWhere.join(' AND ') : ''}`,
                countParams
            );
            /*
             * Every ASM, for the filter — the roster, not only those who
             * already have leads.
             *
             * Sourcing it from the leads meant a newly added ASM was absent
             * from their own filter until someone happened to enquire from
             * their state, which is exactly when an admin wants to check
             * whether anything is reaching them.
             *
             * Never filtered by the active query: narrowing the options to the
             * current result would leave the dropdown holding only the ASM
             * already selected, with no way back to the others.
             */
            const [asmOptions]: any = await db.execute(
                `SELECT a.id, a.name, a.is_active,
                        (SELECT COUNT(*) FROM leads l WHERE l.asm_id = a.id) AS lead_count
                   FROM asms a
                  ORDER BY a.is_active DESC, a.name`
            );

            res.json({ success: true, leads: rows, counts, asms: asmOptions });
        } catch (error: any) {
            console.error('List leads error:', error);
            res.status(500).json({ error: 'Failed to load leads' });
        }
    }
}

import { Request, Response } from 'express';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { routeEnquiry, areaKey } from '../services/asmRouting.service.js';
import { ActivityLogService } from '../services/activity-log.service.js';

export class AsmController {
    /**
     * Called by the Interakt workflow when a customer has given their area.
     *
     * Answers immediately and routes afterwards. Interakt requires a 200 within
     * three seconds and disables the webhook after five failures in ten minutes,
     * so the WhatsApp send must never sit inside the response.
     */
    static async routeEnquiryWebhook(req: Request, res: Response) {
        const { area, phone, name, source, flow_id } = req.body || {};

        if (!phone || !area) {
            return res.status(400).json({ error: 'phone and area are required' });
        }

        // Acknowledge first, work second.
        res.json({ received: true });

        routeEnquiry({
            area: String(area),
            phone: String(phone),
            name: name ? String(name) : null,
            source: source ? String(source) : 'whatsapp',
            flowId: flow_id ? String(flow_id) : null,
            rawPayload: req.body,
        }).catch(err => console.error('[ASM] routing failed:', err?.message));
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

    static async listLeads(req: Request, res: Response) {
        try {
            const { status, source, asm_id, limit } = req.query as Record<string, string>;
            const where: string[] = [];
            const params: any[] = [];
            if (status) { where.push('l.status = ?'); params.push(status); }
            if (source) { where.push('l.source = ?'); params.push(source); }
            if (asm_id) { where.push('l.asm_id = ?'); params.push(asm_id); }

            const [rows]: any = await db.execute(
                `SELECT l.*, a.name AS asm_name, a.phone_number AS asm_phone
                   FROM leads l
                   LEFT JOIN asms a ON a.id = l.asm_id
                   ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                  ORDER BY l.created_at DESC
                  LIMIT ${Math.min(Number(limit) || 200, 1000)}`,
                params
            );
            const [[counts]]: any = await db.execute(
                `SELECT COUNT(*) total,
                        SUM(status = 'sent') sent,
                        SUM(status = 'failed') failed,
                        SUM(status = 'unmatched') unmatched
                   FROM leads`
            );
            res.json({ success: true, leads: rows, counts });
        } catch (error: any) {
            console.error('List leads error:', error);
            res.status(500).json({ error: 'Failed to load leads' });
        }
    }
}

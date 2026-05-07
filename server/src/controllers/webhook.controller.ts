import { Request, Response } from 'express';
import crypto from 'crypto';
import db from '../config/database.js';
import { WhatsAppService } from '../services/whatsapp.service.js';
import { NotificationService } from '../services/notification.service.js';

export class WebhookController {

    /**
     * Handle incoming Interakt webhook events.
     *
     * Real Interakt payload for button clicks:
     *   type: "message_api_clicked"
     *   data.message.button_text: "Approve Installation"
     *   data.message.meta_data.source_data.callback_data: "franchise_verify_<warrantyId>"
     *   data.customer.phone_number: "7827889388"
     *   data.customer.country_code: "+91"
     *   Header: interakt-signature: sha256=<hmac>
     */
    static async handleInterakt(req: Request, res: Response) {

        // Always respond 200 immediately so Interakt doesn't retry
        res.status(200).json({ received: true });

        try {
            const payload   = req.body;
            const eventType = payload?.type || '';

            // Only handle button click events
            if (eventType !== 'message_api_clicked') {
                console.log(`[Webhook] Ignoring event type: "${eventType}"`);
                return;
            }

            const msgData    = payload?.data?.message;
            const customer   = payload?.data?.customer;
            const buttonText: string = msgData?.button_text || '';
            const callbackData: string = msgData?.meta_data?.source_data?.callback_data || '';
            const vendorPhone: string  = customer?.phone_number || '';
            const countryCode: string  = (customer?.country_code || '+91').replace('+', '');
            const fullVendorPhone = `${countryCode}${vendorPhone}`;

            console.log(`[Webhook] Button: "${buttonText}" | callbackData: "${callbackData}" | vendor: ${fullVendorPhone}`);

            // ── Determine action ──────────────────────────────────────────────
            const isApprove = buttonText.toLowerCase().includes('approve');
            const isReject  = buttonText.toLowerCase().includes('reject');

            if (!isApprove && !isReject) {
                console.log(`[Webhook] Unrecognised button: "${buttonText}" — ignoring`);
                return;
            }

            // ── Extract warrantyId from callbackData ──────────────────────────
            let warrantyId: string | null = null;
            if (callbackData.startsWith('franchise_verify_')) {
                warrantyId = callbackData.replace('franchise_verify_', '');
            }

            // Fallback: look up by vendor phone
            if (!warrantyId && vendorPhone) {
                console.warn(`[Webhook] No callbackData prefix — falling back to phone lookup`);
                const [rows]: any = await db.execute(
                    `SELECT wr.uid FROM warranty_registrations wr
                     JOIN vendor_details vd ON vd.store_email = wr.installer_contact
                     JOIN profiles p ON p.id = vd.user_id
                     WHERE p.phone_number = ? AND wr.status = 'pending_vendor'
                     ORDER BY wr.created_at DESC LIMIT 1`,
                    [vendorPhone]
                );
                if (rows.length > 0) warrantyId = rows[0].uid;
            }

            if (!warrantyId) {
                console.error(`[Webhook] Could not resolve warrantyId from: "${callbackData}"`);
                return;
            }

            // ── Check DB status first ─────────────────────────────────────────
            const [warranties]: any = await db.execute(
                `SELECT uid, customer_name, installer_name, status
                 FROM warranty_registrations WHERE uid = ?`,
                [warrantyId]
            );

            if (warranties.length === 0) {
                console.error(`[Webhook] Warranty not found: ${warrantyId}`);
                return;
            }

            const warranty = warranties[0];

            // ── Already responded — send friendly message and stop ────────────
            if (warranty.status !== 'pending_vendor') {
                console.warn(`[Webhook] Warranty ${warrantyId} already "${warranty.status}" — sending already-responded notice`);
                if (process.env.ENABLE_WHATSAPP === 'true' && fullVendorPhone) {
                    try {
                        await WhatsAppService.sendFranchiseVerifyResponded(fullVendorPhone, warrantyId);
                    } catch (err) {
                        console.error('[Webhook] Already-responded message failed:', err);
                    }
                }
                return;
            }

            // ── Process the response ──────────────────────────────────────────
            if (isApprove) {
                await WebhookController.handleApprove(warrantyId, warranty, fullVendorPhone);
            } else {
                await WebhookController.handleReject(warrantyId, warranty, fullVendorPhone);
            }

        } catch (err) {
            console.error('[Webhook] Error processing payload:', err);
        }
    }

    // ── Approve Handler ───────────────────────────────────────────────────────
    private static async handleApprove(warrantyId: string, warranty: any, vendorPhone: string) {
        await db.execute(
            `UPDATE warranty_registrations SET status = 'pending' WHERE uid = ?`,
            [warrantyId]
        );
        console.log(`[Webhook] ✅ Vendor approved ${warrantyId} — moved to admin review`);

        if (process.env.ENABLE_WHATSAPP === 'true' && vendorPhone) {
            try {
                await WhatsAppService.sendFranchiseVerifyConfirmed(vendorPhone, '', '', warrantyId);
            } catch (err) {
                console.error('[Webhook] Approval confirmation WhatsApp failed:', err);
            }
        }

        try {
            await NotificationService.broadcast({
                title: 'Warranty Verified by Franchise',
                message: `${warranty.installer_name || 'A franchise'} confirmed ${warranty.customer_name}'s installation. Ready for HQ review.`,
                type: 'warranty',
                link: `/admin/verifications?uid=${warrantyId}`,
                targetUsers: [],
                targetRole: 'admin'
            });
        } catch (err) {
            console.error('[Webhook] Admin notification failed:', err);
        }
    }

    // ── Reject Handler ────────────────────────────────────────────────────────
    private static async handleReject(warrantyId: string, warranty: any, vendorPhone: string) {
        await db.execute(
            `UPDATE warranty_registrations
             SET status = 'rejected', rejection_reason = 'Franchise store could not confirm this installation.'
             WHERE uid = ?`,
            [warrantyId]
        );
        console.log(`[Webhook] ❌ Vendor rejected ${warrantyId}`);

        if (process.env.ENABLE_WHATSAPP === 'true' && vendorPhone) {
            try {
                await WhatsAppService.sendFranchiseVerifyRejected(vendorPhone, '', '', warrantyId);
            } catch (err) {
                console.error('[Webhook] Rejection confirmation WhatsApp failed:', err);
            }
        }

        try {
            await NotificationService.broadcast({
                title: 'Warranty Rejected by Franchise',
                message: `${warranty.installer_name || 'A franchise'} could not confirm ${warranty.customer_name}'s installation.`,
                type: 'warranty',
                link: `/admin/verifications?uid=${warrantyId}`,
                targetUsers: [],
                targetRole: 'admin'
            });
        } catch (err) {
            console.error('[Webhook] Admin notification failed:', err);
        }
    }
}

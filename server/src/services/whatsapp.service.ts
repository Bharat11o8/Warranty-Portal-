import axios from 'axios';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Service to handle all WhatsApp Business API communications via Interakt
 * API Docs: https://www.interakt.shop/resource-center/how-to-send-whatsapp-templates-using-apis-webhooks/
 */
export class WhatsAppService {
    private static readonly API_URL = 'https://api.interakt.ai/v1/public/message/';
    private static readonly API_KEY = process.env.INTERAKT_API_KEY;

    /**
     * Splits a phone number into countryCode and phoneNumber for Interakt's format.
     * Interakt requires: countryCode: "+91", phoneNumber: "9876543210" (no country code, no leading 0)
     */
    private static formatPhoneNumber(phone: string): { countryCode: string; phoneNumber: string } {
        // Remove all non-numeric characters except leading +
        let cleaned = phone.replace(/[^\d+]/g, '');

        // If starts with +91
        if (cleaned.startsWith('+91')) {
            return { countryCode: '+91', phoneNumber: cleaned.substring(3) };
        }

        // If starts with 91 and is 12 digits
        if (cleaned.startsWith('91') && cleaned.length === 12) {
            return { countryCode: '+91', phoneNumber: cleaned.substring(2) };
        }

        // If starts with 0 and is 11 digits (Indian format with leading 0)
        if (cleaned.startsWith('0') && cleaned.length === 11) {
            return { countryCode: '+91', phoneNumber: cleaned.substring(1) };
        }

        // If it's exactly 10 digits, assume Indian number
        if (cleaned.length === 10) {
            return { countryCode: '+91', phoneNumber: cleaned };
        }

        // Fallback: return as-is with +91 default
        return { countryCode: '+91', phoneNumber: cleaned };
    }

    /**
     * Generic function to send a WhatsApp template message via Interakt
     */
    private static async sendTemplateMessage(
        phone: string,
        templateName: string,
        bodyValues: string[],
        context: string,
        referenceId?: string,
        buttonValues?: string[],  // For templates with variable buttons (e.g., OTP copy button)
        headerValues?: string[]   // For templates with text or media (image/video) headers
    ): Promise<boolean> {
        const logId = uuidv4();
        const { countryCode, phoneNumber } = this.formatPhoneNumber(phone);

        if (!this.API_KEY) {
            console.error('[WhatsApp] Configuration missing. Set INTERAKT_API_KEY in .env');
            await this.logMessage({
                id: logId,
                recipient_phone: `${countryCode}${phoneNumber}`,
                channel: 'whatsapp',
                template_name: templateName,
                status: 'failed',
                context,
                reference_id: referenceId,
                error_message: 'INTERAKT_API_KEY not configured'
            });
            return false;
        }

        try {
            const payload: any = {
                countryCode,
                phoneNumber,
                type: 'Template',
                callbackData: referenceId ? `${context}_${referenceId}` : context,
                template: {
                    name: templateName,
                    languageCode: 'en',
                }
            };

            // Only include bodyValues if there are variables in the template
            // WhatsApp/Interakt rejects values containing tabs, newlines, or 3+ consecutive spaces.
            // Also strip non-breaking spaces (\u00A0) and other Unicode whitespace that
            // toLocaleDateString() can inject depending on the Node.js/ICU version.
            if (bodyValues.length > 0) {
                payload.template.bodyValues = bodyValues.map(val =>
                    String(val)
                        .replace(/[\t\r\n\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, ' ') // tabs, newlines, unicode spaces → single space
                        .replace(/ {3,}/g, '  ')       // collapse 3+ consecutive spaces to max 2
                        .trim()
                );
            }

            // Include buttonValues if the template has variable buttons (e.g., OTP copy button)
            // Interakt expects format: { "0": ["value"], "1": ["value"] }
            if (buttonValues && buttonValues.length > 0) {
                const buttonValuesObj: Record<string, string[]> = {};
                buttonValues.forEach((val, index) => {
                    buttonValuesObj[String(index)] = [String(val)];
                });
                payload.template.buttonValues = buttonValuesObj;
            }

            // Include headerValues for templates with a text header variable or a dynamic media
            // (image/video/document) header. For image headers, headerValues[0] is the public image URL.
            if (headerValues && headerValues.length > 0) {
                payload.template.headerValues = headerValues;
            }

            const response = await axios.post(
                this.API_URL,
                payload,
                {
                    headers: {
                        'Authorization': `Basic ${this.API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`[WhatsApp] Sent "${templateName}" to ${countryCode}${phoneNumber} — ID: ${response.data?.id}`);

            await this.logMessage({
                id: logId,
                recipient_phone: `${countryCode}${phoneNumber}`,
                channel: 'whatsapp',
                template_name: templateName,
                status: 'sent',
                context,
                reference_id: referenceId
            });

            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.message || error.response?.data?.error || error.message;
            console.error(`[WhatsApp] Failed to send "${templateName}" to ${countryCode}${phoneNumber}:`, errMsg);

            await this.logMessage({
                id: logId,
                recipient_phone: `${countryCode}${phoneNumber}`,
                channel: 'whatsapp',
                template_name: templateName,
                status: 'failed',
                context,
                reference_id: referenceId,
                error_message: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)
            });

            return false;
        }
    }

    // ---------------------------------------------------------------------------
    // Admin Broadcast kill-switch
    // ---------------------------------------------------------------------------

    /** Set to true mid-broadcast to stop sending any further messages. */
    private static broadcastAborted = false;

    /** Call this to immediately halt any in-progress admin broadcast. */
    static abortBroadcast(): void {
        this.broadcastAborted = true;
        console.warn('[WhatsApp] Admin broadcast ABORTED by admin request.');
    }

    /**
     * Sends a broadcast announcement to a list of franchise phone numbers.
     *
     * Template selection:
     *   • imageUrl provided  → af_admin_broadcast_img  (Marketing, image header)
     *   • imageUrl absent    → af_admin_broadcast_2  (Utility, no header)
     *
     * Sends are throttled at 200 ms per phone to stay within Interakt rate limits.
     * Can be stopped mid-flight by calling WhatsAppService.abortBroadcast().
     *
     * @param phones   - Array of raw phone numbers (any format; formatPhoneNumber handles normalisation)
     * @param title    - Announcement heading (used as text header on the text-only template)
     * @param message  - Announcement body (truncated to 1000 chars if too long)
     * @param imageUrl - Optional publicly-accessible HTTPS image URL
     * @returns        - { sent, failed, aborted } counts
     */
    static async sendAdminBroadcast(
        phones: string[],
        title: string,
        message: string,
        imageUrl?: string
    ): Promise<{ sent: number; failed: number; aborted: boolean }> {
        const MAX_MESSAGE_LENGTH = 1000;

        // Reset kill-switch for this new broadcast run
        this.broadcastAborted = false;

        // Sanitise the title (single-line field — strip newlines)
        const sanitiseTitle = (val: string) =>
            String(val)
                .replace(/[\t\r\n\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, ' ')
                .replace(/ {3,}/g, '  ')
                .trim();

        // Sanitise the body — PRESERVE \n so multi-line messages keep their formatting.
        // Only strip: \r (Windows line endings), unusual Unicode spaces, and 3+ consecutive blank lines.
        const sanitiseBody = (val: string) =>
            String(val)
                .replace(/\r\n/g, '\n')              // normalise Windows CRLF → LF
                .replace(/\r/g, '\n')                // stray \r → \n
                .replace(/[\t\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, ' ') // unusual spaces/tabs → space
                .replace(/ {3,}/g, '  ')             // 3+ consecutive spaces → 2 spaces
                .replace(/\n{4,}/g, '\n\n\n')        // collapse 4+ blank lines to 3
                .trim();

        const cleanTitle   = sanitiseTitle(title);
        const rawMessage   = sanitiseBody(message);
        const cleanMessage = rawMessage.length > MAX_MESSAGE_LENGTH
            ? rawMessage.substring(0, MAX_MESSAGE_LENGTH - 1) + '\u2026'  // …
            : rawMessage;

        const useImageTemplate = !!(imageUrl && imageUrl.trim());
        const templateName     = useImageTemplate ? 'af_admin_broadcast_img' : 'af_admin_broadcast_2';

        // headerValues:
        //   image template → [imageUrl]  (Interakt passes this as the dynamic media header)
        //   text  template → no header (subject/title removed as per user request)
        const headerValues = useImageTemplate ? [imageUrl!.trim()] : undefined;
        const bodyValues   = [cleanMessage];

        let sent   = 0;
        let failed = 0;

        for (const phone of phones) {
            // Check kill-switch before every send
            if (this.broadcastAborted) {
                console.warn(`[WhatsApp] Broadcast aborted after ${sent} sent, ${phones.length - sent - failed} remaining.`);
                break;
            }

            if (!phone || !phone.trim()) continue;

            const ok = await this.sendTemplateMessage(
                phone,
                templateName,
                bodyValues,
                'admin_broadcast',
                undefined,   // no referenceId for broadcasts
                undefined,   // no buttonValues
                headerValues
            );

            ok ? sent++ : failed++;

            // Throttle: 200 ms between sends to avoid Interakt rate limits
            if (phones.indexOf(phone) < phones.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        console.log(`[WhatsApp] Admin broadcast complete — sent: ${sent}, failed: ${failed}, aborted: ${this.broadcastAborted}, template: ${templateName}`);
        return { sent, failed, aborted: this.broadcastAborted };
    }


    /**
     * Logs communication activity to the database
     */
    private static async logMessage(data: any): Promise<void> {
        try {
            await db.execute(
                `INSERT INTO message_logs 
        (id, recipient_phone, recipient_email, channel, template_name, status, context, reference_id, error_message) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.id,
                    data.recipient_phone || null,
                    data.recipient_email || null,
                    data.channel,
                    data.template_name || null,
                    data.status,
                    data.context,
                    data.reference_id || null,
                    data.error_message || null
                ]
            );
        } catch (err) {
            console.error('[WhatsApp] Failed to log message:', err);
        }
    }

    // ─── PUBLIC METHODS (signatures unchanged) ───────────────────────

    /**
     * Send Login OTP
     * Template: fms_login_otp — Variables: body {{1}} = OTP, button[0] = OTP (copy button)
     */
    static async sendLoginOTP(phone: string, name: string, otp: string): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'fms_login_otp',
            [otp],         // body {{1}} = OTP
            'login_auth',
            undefined,
            [otp]          // button[0] = OTP (copy code button)
        );
    }

    /**
     * Send Warranty Submitted Confirmation
     * Template: af_warranty_submitted_2
     * Variables:
     *   {{1}} = Customer Name
     *   {{2}} = Product Name (e.g. "AquaShield Premium Seat Cover")
     *   {{3}} = Vehicle Registration Number
     *   {{4}} = UID / Serial Number
     *   {{5}} = Product Type (e.g. "Seat Cover", "Paint Protection Film")
     *   {{6}} = Registration Date (DD-MMM-YYYY)
     */
    static async sendWarrantySubmitted(
        phone: string,
        customerName: string,
        productName: string,
        registrationNumber: string,
        uid: string,
        productType: string,
        purchaseDate: string,
        warrantyId: string
    ): Promise<boolean> {
        // Format product type label
        const productTypeLabel = productType === 'seat-cover' ? 'Seat Cover'
            : productType === 'ev-products' ? 'Paint Protection Film'
                : productType;

        // Format date as DD-MMM-YYYY using a safe manual formatter.
        // NOTE: toLocaleDateString('en-IN') can produce non-breaking spaces (\u00A0)
        // or locale-specific separators on some Node.js/ICU versions which WhatsApp rejects.
        const _d = new Date(purchaseDate);
        const _months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const formattedDate = `${String(_d.getDate()).padStart(2, '0')}-${_months[_d.getMonth()]}-${_d.getFullYear()}`;

        return this.sendTemplateMessage(
            phone,
            'af_warranty_submitted_2',
            [customerName, productName, registrationNumber, uid, productTypeLabel, formattedDate],
            'warranty_submitted',
            warrantyId
        );
    }

    /**
     * Welcome message to vendor after OTP verification on registration.
     * Template: af_vendor_welcome
     *   {{1}} = Vendor Name
     * Static message: "Welcome to Autoform India, our team will review and confirm
     * your store and your profile will be activated."
     */
    static async sendVendorWelcome(
        phone: string,
        vendorName: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'af_vendor_welcome',
            [vendorName],
            'vendor_welcome'
        );
    }

    /**
     * Notify customer their warranty has been approved by admin.
     * Template: af_warranty_approved_customer
     *   {{1}} = Customer Name
     *   {{2}} = Product Name
     *   {{3}} = Registration Number
     *   {{4}} = UID
     *   {{5}} = Store Name
     *   {{6}} = Status (e.g. "Approved")
     *   {{7}} = Purchase Date
     *   {{8}} = Warranty Type
     */
    static async sendWarrantyApprovedCustomer(
        phone: string,
        customerName: string,
        productName: string,
        registrationNumber: string,
        uid: string,
        storeName: string,
        status: string,
        purchaseDate: string,
        warrantyType: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'af_warranty_approved_customer',
            [customerName, productName, registrationNumber, uid, storeName, status, purchaseDate, warrantyType],
            'warranty_approved_customer',
            uid
        );
    }

    /**
     * Notify customer their warranty has been rejected by admin.
     * Template: af_cust_warr_rejec_2
     *   {{1}} = Customer Name
     *   {{2}} = Product Name
     *   {{3}} = Registration Number
     *   {{4}} = UID
     *   {{5}} = Store Name
     *   {{6}} = Status (e.g. "Rejected")
     *   {{7}} = Purchase Date
     *   {{8}} = Warranty Type
     *   {{9}} = Rejection Reason
     */
    static async sendWarrantyRejectedCustomer(
        phone: string,
        customerName: string,
        productName: string,
        registrationNumber: string,
        uid: string,
        storeName: string,
        status: string,
        purchaseDate: string,
        warrantyType: string,
        rejectionReason: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'af_cust_warr_rejec_2',
            [customerName, productName, registrationNumber, uid, storeName, status, purchaseDate, warrantyType, rejectionReason],
            'warranty_rejected_customer',
            uid
        );
    }

    /**
     * Notify franchise vendor their submitted warranty was rejected by admin.
     * Template: af_vendor_warr_rejected
     *   {{1}} = Store Name
     *   {{2}} = Product Name
     *   {{3}} = Registration Number
     *   {{4}} = UID
     *   {{5}} = Status (e.g. "Not Approved")
     *   {{6}} = Purchase Date
     *   {{7}} = Warranty Type
     *   {{8}} = Rejection Reason
     */
    static async sendVendorRejected(
        phone: string,
        storeName: string,
        productName: string,
        registrationNumber: string,
        uid: string,
        status: string,
        purchaseDate: string,
        warrantyType: string,
        rejectionReason: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'af_vendor_warr_rejected',
            [storeName, productName, registrationNumber, uid, status, purchaseDate, warrantyType, rejectionReason],
            'vendor_rejected',
            uid
        );
    }

    /**
     * Send Franchise Verification Request
     * Template: franchise_verify_action
     * Variables:
     *   {{1}} = Franchise Store Name
     *   {{2}} = Customer Name
     *   {{3}} = Customer Phone
     *   {{4}} = Vehicle Registration Number
     *   {{5}} = Product Name
     *   {{6}} = UID
     * Buttons: Quick Replies — "Approve Installation" / "Reject Installation" (static)
     */
    static async sendFranchiseVerifyAction(
        phone: string,
        franchiseName: string,
        customerName: string,
        customerPhone: string,
        registrationNumber: string,
        productName: string,
        uid: string,
        warrantyId: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'franchise_verify_action',
            [franchiseName, customerName, customerPhone, registrationNumber, productName, uid],
            'franchise_verify',
            warrantyId
        );
    }

    /**
     * Send Warranty Submission Authorization OTP
     * Template: warranty_auth_otp — Variables: {{1}} = registrant, {{2}} = product, {{3}} = OTP
     */
    static async sendWarrantyAuthOTP(
        phone: string,
        registrantType: string,
        productType: string,
        otp: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'warranty_auth_otp',
            [registrantType, productType, otp],
            'warranty_auth'
        );
    }

    /**
     * Send Warranty Submission Confirmation
     * Template: warranty_confirmed — Variables: {{1}} = name, {{2}} = UID, {{3}} = product, {{4}} = car
     */
    static async sendWarrantyConfirmation(
        phone: string,
        name: string,
        uid: string,
        product: string,
        car: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'warranty_confirmed',
            [name, uid, product, car],
            'warranty_confirm',
            uid
        );
    }

    /**
     * Confirm to franchise vendor that they approved an installation (webhook response)
     * Simple acknowledgement — template TBD, using a basic utility template for now.
     * TODO: Create a dedicated Interakt template for this if needed.
     */
    static async sendFranchiseVerifyConfirmed(
        phone: string,
        franchiseName: string,
        customerName: string,
        warrantyId: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'franchise_verify_approved',
            [],   // No variables — static template
            'franchise_verify_confirmed',
            warrantyId
        );
    }

    /**
     * Confirm to franchise vendor that they rejected an installation (webhook response)
     * Template: franchise_verify_rejected — no variables
     */
    static async sendFranchiseVerifyRejected(
        phone: string,
        franchiseName: string,
        customerName: string,
        warrantyId: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'franchise_verify_rejected',
            [],   // No variables — static template
            'franchise_verify_rejected',
            warrantyId
        );
    }

    /**
     * Notify franchise vendor they already responded to this verification.
     * Template: franchise_verify_responded — no variables (static)
     * Fires when vendor taps a button on a warranty already approved/rejected.
     * TODO: swap template name once Meta approves 'franchise_verify_responded'
     */
    static async sendFranchiseVerifyResponded(
        phone: string,
        warrantyId: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'franchise_verify_responded',
            [],
            'franchise_verify_responded',
            warrantyId
        );
    }

    /**
     * Send Warranty Approval
     * Template: warranty_approved — Variables: {{1}} = name, {{2}} = UID, {{3}} = product, {{4}} = link
     */
    static async sendWarrantyApproval(
        phone: string,
        name: string,
        uid: string,
        product: string,
        certLink: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'warranty_approved',
            [name, uid, product, certLink],
            'warranty_approve',
            uid
        );
    }

    /**
     * Send Warranty Rejection
     * Template: warranty_rejected — Variables: {{1}} = name, {{2}} = UID, {{3}} = reason, {{4}} = link
     */
    static async sendWarrantyRejection(
        phone: string,
        name: string,
        uid: string,
        reason: string,
        editLink: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'warranty_rejected',
            [name, uid, reason, editLink],
            'warranty_reject',
            uid
        );
    }

    /**
     * Send Installation Confirmation Request to Franchise
     * Template: installation_confirm — Variables: {{1}} = vendor, {{2}} = customer, {{3}} = car, {{4}} = link
     */
    static async sendInstallationConfirmation(
        phone: string,
        vendorName: string,
        customerName: string,
        carDetails: string,
        confirmLink: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'installation_confirm',
            [vendorName, customerName, carDetails, confirmLink],
            'install_confirm'
        );
    }

    /**
     * Send Grievance Assignment to Assignee
     * Template: grievance_assigned — Variables: {{1}} = assignee, {{2}} = ticketId, {{3}} = category
     */
    static async sendGrievanceAssignment(
        phone: string,
        assigneeName: string,
        ticketId: string,
        category: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'grievance_assigned',
            [assigneeName, ticketId, category],
            'grievance_assign',
            ticketId
        );
    }

    /**
     * Send Grievance Status Update to Customer/Franchise
     * Template: grievance_status_update — Variables: {{1}} = name, {{2}} = ticketId, {{3}} = status
     */
    static async sendGrievanceUpdate(
        phone: string,
        name: string,
        ticketId: string,
        status: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'grievance_status_update',
            [name, ticketId, status],
            'grievance_update',
            ticketId
        );
    }

    /**
     * New Registration Welcome
     * Template: welcome_registration — Variables: {{1}} = name, {{2}} = warrantyId
     */
    static async sendPublicWelcome(
        phone: string,
        name: string,
        warrantyId: string
    ): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'welcome_registration',
            [name, warrantyId],
            'registrant_welcome',
            warrantyId
        );
    }
}

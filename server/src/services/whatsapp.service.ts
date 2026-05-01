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
        buttonValues?: string[]  // For templates with variable buttons (e.g., OTP copy button)
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
            if (bodyValues.length > 0) {
                payload.template.bodyValues = bodyValues.map(val => String(val));
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

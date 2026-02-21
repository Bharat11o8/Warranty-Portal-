import axios from 'axios';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Service to handle all WhatsApp Business API communications
 */
export class WhatsAppService {
    private static readonly API_URL = process.env.WHATSAPP_API_URL;
    private static readonly ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    private static readonly PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    /**
     * Formats a phone number to E.164 format (specifically Indian numbers for now)
     */
    private static formatPhoneNumber(phone: string): string {
        // Remove all non-numeric characters
        let cleaned = phone.replace(/\D/g, '');

        // If it's 10 digits, add +91 prefix
        if (cleaned.length === 10) {
            return `91${cleaned}`;
        }

        // If it starts with 0 and then 10 digits
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            return `91${cleaned.substring(1)}`;
        }

        // Return as is if it's already properly formatted or other format
        return cleaned;
    }

    /**
     * Generic function to send a WhatsApp template message
     */
    private static async sendTemplateMessage(
        phone: string,
        templateName: string,
        parameters: any[],
        context: string,
        referenceId?: string
    ): Promise<boolean> {
        const logId = uuidv4();
        const formattedPhone = this.formatPhoneNumber(phone);

        if (!this.API_URL || !this.ACCESS_TOKEN) {
            console.error('[WhatsApp] Configuration missing. Set WHATSAPP_API_URL and WHATSAPP_ACCESS_TOKEN');
            await this.logMessage({
                id: logId,
                recipient_phone: formattedPhone,
                channel: 'whatsapp',
                template_name: templateName,
                status: 'failed',
                context,
                reference_id: referenceId,
                error_message: 'Configuration missing'
            });
            return false;
        }

        try {
            const response = await axios.post(
                this.API_URL,
                {
                    messaging_product: 'whatsapp',
                    to: formattedPhone,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: 'en_US' },
                        components: [
                            {
                                type: 'body',
                                parameters: parameters.map(val => ({ type: 'text', text: String(val) }))
                            }
                        ]
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            await this.logMessage({
                id: logId,
                recipient_phone: formattedPhone,
                channel: 'whatsapp',
                template_name: templateName,
                status: 'sent',
                context,
                reference_id: referenceId
            });

            return true;
        } catch (error: any) {
            const errMsg = error.response?.data?.error?.message || error.message;
            console.error(`[WhatsApp] Failed to send "${templateName}":`, errMsg);

            await this.logMessage({
                id: logId,
                recipient_phone: formattedPhone,
                channel: 'whatsapp',
                template_name: templateName,
                status: 'failed',
                context,
                reference_id: referenceId,
                error_message: errMsg
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

    /**
     * API: Send Login OTP
     */
    static async sendLoginOTP(phone: string, name: string, otp: string): Promise<boolean> {
        return this.sendTemplateMessage(
            phone,
            'login_otp',
            [otp], // Variables: {{1}}
            'login_auth'
        );
    }

    /**
     * API: Send Warranty Submission Authorization OTP
     */
    static async sendWarrantyAuthOTP(
        phone: string,
        registrantType: string,
        productType: string,
        otp: string
    ): Promise<boolean> {
        // Template: {{1}} is asking for OTP to register {{2}} warranty. Code: {{3}}
        return this.sendTemplateMessage(
            phone,
            'warranty_auth_otp',
            [registrantType, productType, otp],
            'warranty_auth'
        );
    }

    /**
     * API: Send Warranty Submission Confirmation
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
     * API: Send Warranty Approval
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
     * API: Send Warranty Rejection
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
     * API: Send Installation Confirmation Request to Franchise
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
     * API: Send Grievance Assignment to Assignee
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
     * API: Send Grievance Status Update to Customer/Franchise
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
     * API: New Registration Welcome
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

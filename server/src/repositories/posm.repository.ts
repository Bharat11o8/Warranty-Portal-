import { BaseRepository } from './base.repository.js';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export interface POSMRequest {
    id: number;
    ticket_id: string;
    franchise_id: string;
    requirement: string;
    status: 'open' | 'under_review' | 'approved' | 'in_production' | 'dispatched' | 'delivered' | 'closed' | 'rejected';
    internal_notes?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface POSMMessage {
    id: number;
    request_id: number;
    sender_id: string;
    sender_role: 'admin' | 'franchise';
    message: string | null;
    attachments: any | null; // JSON string or parsed object
    created_at?: Date;
}

export class POSMRepository extends BaseRepository<POSMRequest> {
    constructor() {
        super('posm_requests', 'id');
    }

    /**
     * Create a new POSM request and return the inserted ID
     */
    async createPOSMRequest(request: Omit<POSMRequest, 'id'>, connection?: PoolConnection): Promise<number> {
        const result = await this.execute(
            `INSERT INTO posm_requests (ticket_id, franchise_id, requirement, status) 
             VALUES (?, ?, ?, ?)`,
            [request.ticket_id, request.franchise_id, request.requirement, request.status || 'open'],
            connection
        );
        return result.insertId;
    }

    /**
     * Get all requests for a specific franchise
     */
    async getFranchiseRequests(franchiseId: string, connection?: PoolConnection): Promise<POSMRequest[]> {
        return this.findBy('franchise_id', franchiseId, connection);
    }

    /**
     * Get messages for a specific request
     */
    async getMessages(requestId: number, connection?: PoolConnection): Promise<POSMMessage[]> {
        const rows = await this.query<RowDataPacket[]>(
            `SELECT * FROM posm_messages WHERE request_id = ? ORDER BY created_at ASC`,
            [requestId],
            connection
        );

        return (rows as any[]).map(msg => ({
            ...msg,
            attachments: typeof msg.attachments === 'string' ? JSON.parse(msg.attachments) : msg.attachments
        })) as POSMMessage[];
    }

    /**
     * Create a new message
     */
    async createMessage(message: Omit<POSMMessage, 'id'>, connection?: PoolConnection): Promise<number> {
        const result = await this.execute(
            `INSERT INTO posm_messages (request_id, sender_id, sender_role, message, attachments) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                message.request_id,
                message.sender_id,
                message.sender_role,
                message.message,
                message.attachments ? JSON.stringify(message.attachments) : null
            ],
            connection
        );
        return result.insertId;
    }

    /**
     * Update request status and optionally internal notes
     */
    async updateStatus(requestId: number, status: string, internalNotes?: string | null, connection?: PoolConnection): Promise<boolean> {
        let sql = `UPDATE posm_requests SET status = ?`;
        const params: any[] = [status];

        if (internalNotes !== undefined) {
            sql += `, internal_notes = ?`;
            params.push(internalNotes);
        }

        sql += ` WHERE id = ?`;
        params.push(requestId);

        const result = await this.execute(sql, params, connection);
        return result.affectedRows > 0;
    }

    /**
     * Get all requests for admin with franchise details
     */
    async getAllRequests(connection?: PoolConnection): Promise<any[]> {
        const rows = await this.query<RowDataPacket[]>(
            `SELECT 
                r.*,
                vd.store_name,
                p.name as contact_name,
                p.email as contact_email
             FROM posm_requests r
             JOIN vendor_details vd ON r.franchise_id = vd.id
             JOIN profiles p ON vd.user_id = p.id
             ORDER BY r.created_at DESC`,
            [],
            connection
        );
        return rows;
    }

    /**
     * Get total count of open requests for admin overview
     */
    async getOpenRequestsCount(connection?: PoolConnection): Promise<number> {
        return this.count("status != 'closed' AND status != 'rejected'", [], connection);
    }
}

export const posmRepository = new POSMRepository();

import { BaseRepository } from './base.repository.js';
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';

/**
 * Warranty Registration Interface
 */
export interface WarrantyRegistration {
    id?: string;
    uid: string;
    user_id: string;
    product_type: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    car_make?: string;
    car_model?: string;
    car_year: string;
    registration_number: string;
    purchase_date: string;
    installer_name?: string;
    installer_contact?: string;
    product_details: any;
    manpower_id?: string;
    warranty_type: string;
    status: 'pending' | 'pending_vendor' | 'validated' | 'rejected';
    rejection_reason?: string;
    created_at?: Date;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
    page: number;
    limit: number;
}

/**
 * Warranty Repository
 * Handles warranty registration database operations
 */
export class WarrantyRepository extends BaseRepository<WarrantyRegistration> {
    constructor() {
        super('warranty_registrations', 'uid');
    }

    /**
     * Find warranty by UID
     */
    async findByUid(uid: string, connection?: PoolConnection): Promise<WarrantyRegistration | null> {
        const rows = await this.query<RowDataPacket[]>(
            'SELECT * FROM warranty_registrations WHERE uid = ? OR id = ?',
            [uid, uid],
            connection
        );
        return rows.length > 0 ? (rows[0] as WarrantyRegistration) : null;
    }

    /**
     * Find warranties by user ID with pagination
     */
    async findByUserId(
        userId: string,
        options: PaginationOptions,
        connection?: PoolConnection
    ): Promise<{ warranties: WarrantyRegistration[]; total: number }> {
        const offset = (options.page - 1) * options.limit;

        // Get total count
        const countRows = await this.query<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM warranty_registrations WHERE user_id = ?',
            [userId],
            connection
        );
        const total = countRows[0].total;

        // Get paginated results
        const rows = await this.query<RowDataPacket[]>(
            `SELECT w.*, m.name as manpower_name_from_db 
             FROM warranty_registrations w 
             LEFT JOIN manpower m ON w.manpower_id = m.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC 
             LIMIT ? OFFSET ?`,
            [userId, options.limit, offset],
            connection
        );

        return {
            warranties: rows as WarrantyRegistration[],
            total
        };
    }

    /**
     * Find warranties by customer email
     */
    async findByCustomerEmail(email: string, connection?: PoolConnection): Promise<WarrantyRegistration[]> {
        const rows = await this.query<RowDataPacket[]>(
            `SELECT wr.*, p.name as submitted_by_name, p.email as submitted_by_email,
                    m.name as manpower_name_from_db
             FROM warranty_registrations wr
             LEFT JOIN profiles p ON wr.user_id = p.id
             LEFT JOIN manpower m ON wr.manpower_id = m.id
             WHERE wr.customer_email = ?
             ORDER BY wr.created_at DESC`,
            [email],
            connection
        );
        return rows as WarrantyRegistration[];
    }

    /**
     * Get all warranties with pagination (admin view)
     */
    async findAllPaginated(
        options: PaginationOptions,
        connection?: PoolConnection
    ): Promise<{ warranties: WarrantyRegistration[]; total: number }> {
        const offset = (options.page - 1) * options.limit;

        const countRows = await this.query<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM warranty_registrations',
            [],
            connection
        );
        const total = countRows[0].total;

        const rows = await this.query<RowDataPacket[]>(
            `SELECT wr.*, p.name as submitted_by_name, p.email as submitted_by_email,
                    ur.role as submitted_by_role, m.name as manpower_name_from_db
             FROM warranty_registrations wr
             LEFT JOIN profiles p ON wr.user_id = p.id
             LEFT JOIN user_roles ur ON p.id = ur.user_id
             LEFT JOIN manpower m ON wr.manpower_id = m.id
             ORDER BY wr.created_at DESC
             LIMIT ? OFFSET ?`,
            [options.limit, offset],
            connection
        );

        return {
            warranties: rows as WarrantyRegistration[],
            total
        };
    }

    /**
     * Create a new warranty registration
     */
    async create(warranty: Omit<WarrantyRegistration, 'created_at'>, connection?: PoolConnection): Promise<void> {
        await this.execute(
            `INSERT INTO warranty_registrations 
             (uid, user_id, product_type, customer_name, customer_email, customer_phone, 
              customer_address, car_make, car_model, car_year, registration_number, 
              purchase_date, installer_name, installer_contact, product_details, 
              manpower_id, warranty_type, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                warranty.uid,
                warranty.user_id,
                warranty.product_type,
                warranty.customer_name,
                warranty.customer_email,
                warranty.customer_phone,
                warranty.customer_address,
                warranty.car_make || null,
                warranty.car_model || null,
                warranty.car_year,
                warranty.registration_number,
                warranty.purchase_date,
                warranty.installer_name || null,
                warranty.installer_contact || null,
                JSON.stringify(warranty.product_details),
                warranty.manpower_id || null,
                warranty.warranty_type,
                warranty.status
            ],
            connection
        );
    }

    /**
     * Update warranty status
     */
    async updateStatus(
        uid: string,
        status: string,
        rejectionReason?: string,
        connection?: PoolConnection
    ): Promise<void> {
        await this.execute(
            'UPDATE warranty_registrations SET status = ?, rejection_reason = ? WHERE uid = ?',
            [status, rejectionReason || null, uid],
            connection
        );
    }

    /**
     * Count warranties by status
     */
    async countByStatus(status: string, connection?: PoolConnection): Promise<number> {
        return this.count('status = ?', [status], connection);
    }

    /**
     * Get unique customers with statistics
     */
    async getCustomersWithStats(connection?: PoolConnection): Promise<any[]> {
        const rows = await this.query<RowDataPacket[]>(
            `SELECT 
                MAX(customer_name) as customer_name,
                customer_email,
                MAX(customer_phone) as customer_phone,
                COUNT(*) as total_warranties,
                SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated_warranties,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_warranties,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_warranties,
                MIN(created_at) as first_warranty_date,
                MAX(created_at) as last_warranty_date
             FROM warranty_registrations
             GROUP BY customer_email
             ORDER BY last_warranty_date DESC`,
            [],
            connection
        );
        return rows;
    }

    /**
     * Delete warranties by customer email
     */
    async deleteByCustomerEmail(email: string, connection?: PoolConnection): Promise<boolean> {
        const result = await this.execute(
            'DELETE FROM warranty_registrations WHERE customer_email = ?',
            [email],
            connection
        );
        return result.affectedRows > 0;
    }
}

// Export singleton instance
export const warrantyRepository = new WarrantyRepository();

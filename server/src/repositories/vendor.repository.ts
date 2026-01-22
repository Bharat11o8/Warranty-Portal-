import { BaseRepository } from './base.repository.js';
import { getISTTimestamp } from '../config/database.js';
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';

/**
 * Vendor Details Interface
 */
export interface VendorDetails {
    id: string;
    user_id: string;
    store_name: string;
    store_email?: string;
    address: string;
    state: string;
    city: string;
    pincode: string;
    created_at?: Date;
}

/**
 * Vendor Verification Interface
 */
export interface VendorVerification {
    id: string;
    user_id: string;
    is_verified: boolean;
    verified_at?: Date;
}

/**
 * Manpower Interface
 */
export interface Manpower {
    id: string;
    vendor_id: string;
    name: string;
    phone_number: string;
    manpower_id: string;
    applicator_type: string;
    is_active: boolean;
    created_at?: Date;
}

/**
 * Vendor Repository
 * Handles vendor-related database operations
 */
export class VendorRepository extends BaseRepository<VendorDetails> {
    constructor() {
        super('vendor_details', 'id');
    }

    /**
     * Find vendor details by user ID
     */
    async findByUserId(userId: string, connection?: PoolConnection): Promise<VendorDetails | null> {
        return this.findOneBy('user_id', userId, connection);
    }

    /**
     * Get vendor verification status
     */
    async getVerificationStatus(userId: string, connection?: PoolConnection): Promise<boolean> {
        const rows = await this.query<RowDataPacket[]>(
            'SELECT is_verified FROM vendor_verification WHERE user_id = ?',
            [userId],
            connection
        );
        return rows.length > 0 ? rows[0].is_verified : false;
    }

    /**
     * Create vendor details
     */
    async create(details: VendorDetails, connection?: PoolConnection): Promise<void> {
        await this.execute(
            `INSERT INTO vendor_details 
             (id, user_id, store_name, store_email, address, state, city, pincode) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                details.id,
                details.user_id,
                details.store_name,
                details.store_email || null,
                details.address,
                details.state,
                details.city,
                details.pincode
            ],
            connection
        );
    }

    /**
     * Create vendor verification record
     */
    async createVerification(
        id: string,
        userId: string,
        isVerified: boolean = false,
        connection?: PoolConnection
    ): Promise<void> {
        await this.execute(
            'INSERT INTO vendor_verification (id, user_id, is_verified) VALUES (?, ?, ?)',
            [id, userId, isVerified],
            connection
        );
    }

    /**
     * Update vendor verification status
     */
    async updateVerification(
        userId: string,
        isVerified: boolean,
        connection?: PoolConnection
    ): Promise<void> {
        await this.execute(
            'UPDATE vendor_verification SET is_verified = ?, verified_at = ? WHERE user_id = ?',
            [isVerified, getISTTimestamp(), userId],
            connection
        );
    }

    /**
     * Get all vendors with full details (admin view)
     */
    async getAllVendorsWithDetails(connection?: PoolConnection): Promise<any[]> {
        const rows = await this.query<RowDataPacket[]>(
            `SELECT 
                p.id,
                p.name as contact_name,
                p.email,
                p.phone_number,
                vd.store_name,
                vd.store_email,
                vd.city,
                vd.state,
                vd.address as full_address,
                vd.pincode,
                COALESCE(vv.is_verified, false) as is_verified,
                vv.verified_at,
                (SELECT COUNT(*) FROM manpower WHERE vendor_id = vd.id) as manpower_count,
                (SELECT COUNT(*) FROM warranty_registrations wr 
                 WHERE wr.manpower_id IN (SELECT id FROM manpower WHERE vendor_id = vd.id)
                ) as total_warranties
             FROM profiles p
             JOIN user_roles ur ON p.id = ur.user_id
             LEFT JOIN vendor_details vd ON p.id = vd.user_id
             LEFT JOIN vendor_verification vv ON p.id = vv.user_id
             WHERE ur.role = 'vendor'
             ORDER BY p.created_at DESC`,
            [],
            connection
        );
        return rows;
    }

    /**
     * Get manpower for a vendor
     */
    async getManpower(vendorDetailsId: string, includeInactive: boolean = false, connection?: PoolConnection): Promise<Manpower[]> {
        const activeClause = includeInactive ? '' : 'AND m.is_active = true';
        const rows = await this.query<RowDataPacket[]>(
            `SELECT m.*,
                    (SELECT COUNT(*) FROM warranty_registrations w WHERE w.manpower_id = m.id) as total_applications,
                    (SELECT COUNT(*) FROM warranty_registrations w WHERE w.manpower_id = m.id AND w.status = 'validated') as points
             FROM manpower m 
             WHERE m.vendor_id = ? ${activeClause}
             ORDER BY points DESC, m.name ASC`,
            [vendorDetailsId],
            connection
        );
        return rows as Manpower[];
    }

    /**
     * Add manpower to vendor
     */
    async addManpower(manpower: Manpower, connection?: PoolConnection): Promise<void> {
        await this.execute(
            `INSERT INTO manpower 
             (id, vendor_id, name, phone_number, manpower_id, applicator_type, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                manpower.id,
                manpower.vendor_id,
                manpower.name,
                manpower.phone_number,
                manpower.manpower_id,
                manpower.applicator_type,
                manpower.is_active !== false
            ],
            connection
        );
    }

    /**
     * Soft delete manpower (set inactive)
     */
    async deactivateManpower(manpowerId: string, connection?: PoolConnection): Promise<void> {
        await this.execute(
            'UPDATE manpower SET is_active = false WHERE id = ?',
            [manpowerId],
            connection
        );
    }
}

// Export singleton instance
export const vendorRepository = new VendorRepository();

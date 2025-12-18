import { BaseRepository } from './base.repository.js';
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';

/**
 * User Profile Interface
 */
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    password?: string;
    created_at?: Date;
}

/**
 * User Role Interface
 */
export interface UserRole {
    id: string;
    user_id: string;
    role: 'customer' | 'vendor' | 'admin';
}

/**
 * User Repository
 * Handles user profile and role database operations
 */
export class UserRepository extends BaseRepository<UserProfile> {
    constructor() {
        super('profiles', 'id');
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string, connection?: PoolConnection): Promise<UserProfile | null> {
        return this.findOneBy('email', email, connection);
    }

    /**
     * Find user by phone number
     */
    async findByPhone(phone: string, connection?: PoolConnection): Promise<UserProfile | null> {
        return this.findOneBy('phone_number', phone, connection);
    }

    /**
     * Get user's role
     */
    async getRole(userId: string, connection?: PoolConnection): Promise<string | null> {
        const rows = await this.query<RowDataPacket[]>(
            'SELECT role FROM user_roles WHERE user_id = ?',
            [userId],
            connection
        );
        return rows.length > 0 ? rows[0].role : null;
    }

    /**
     * Create a new user profile
     */
    async create(
        id: string,
        name: string,
        email: string,
        phoneNumber: string,
        password?: string,
        connection?: PoolConnection
    ): Promise<void> {
        if (password) {
            await this.execute(
                'INSERT INTO profiles (id, name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)',
                [id, name, email, phoneNumber, password],
                connection
            );
        } else {
            await this.execute(
                'INSERT INTO profiles (id, name, email, phone_number) VALUES (?, ?, ?, ?)',
                [id, name, email, phoneNumber],
                connection
            );
        }
    }

    /**
     * Create user role
     */
    async createRole(
        id: string,
        userId: string,
        role: string,
        connection?: PoolConnection
    ): Promise<void> {
        await this.execute(
            'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
            [id, userId, role],
            connection
        );
    }

    /**
     * Update user profile
     */
    async update(
        id: string,
        name: string,
        email: string,
        phoneNumber: string,
        connection?: PoolConnection
    ): Promise<void> {
        await this.execute(
            'UPDATE profiles SET name = ?, email = ?, phone_number = ? WHERE id = ?',
            [name, email, phoneNumber, id],
            connection
        );
    }

    /**
     * Get users by role with count
     */
    async countByRole(role: string, connection?: PoolConnection): Promise<number> {
        const rows = await this.query<RowDataPacket[]>(
            "SELECT COUNT(*) as count FROM user_roles WHERE role = ?",
            [role],
            connection
        );
        return rows[0].count;
    }

    /**
     * Check if email already exists (excluding a specific user)
     */
    async emailExistsExcluding(email: string, excludeId: string, connection?: PoolConnection): Promise<boolean> {
        const rows = await this.query<RowDataPacket[]>(
            'SELECT 1 FROM profiles WHERE email = ? AND id != ? LIMIT 1',
            [email, excludeId],
            connection
        );
        return rows.length > 0;
    }
}

// Export singleton instance
export const userRepository = new UserRepository();

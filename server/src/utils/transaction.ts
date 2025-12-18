import db from '../config/database.js';
import { AppError, ErrorCode } from './errors.js';
import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * Transaction Helper Utility
 * Provides safe transaction handling for multi-table operations
 */

export type TransactionCallback<T> = (connection: PoolConnection) => Promise<T>;

/**
 * Execute a function within a database transaction
 * Automatically handles commit/rollback and connection release
 * 
 * @example
 * const result = await withTransaction(async (conn) => {
 *     await conn.execute('INSERT INTO users...', [...]);
 *     await conn.execute('INSERT INTO roles...', [...]);
 *     return { success: true };
 * });
 */
export async function withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const result = await callback(connection);

        await connection.commit();
        return result;
    } catch (error: any) {
        await connection.rollback();

        console.error('[Transaction] Rolled back due to error:', error.message);

        // Re-throw as AppError if not already
        if (error instanceof AppError) {
            throw error;
        }

        // Handle MySQL-specific errors
        if (error.code === 'ER_DUP_ENTRY') {
            throw new AppError(
                ErrorCode.DUPLICATE_ENTRY,
                'This record already exists',
                409
            );
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'Referenced record not found',
                400
            );
        }

        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Database operation failed',
            500,
            { originalError: error.message }
        );
    } finally {
        connection.release();
    }
}

/**
 * Helper for running a single query (no transaction needed)
 * Provides consistent error handling
 */
export async function query<T extends RowDataPacket[]>(
    sql: string,
    params?: any[]
): Promise<T> {
    try {
        const [rows] = await db.execute<T>(sql, params);
        return rows;
    } catch (error: any) {
        console.error('[Query] Error:', error.message);
        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Database query failed',
            500
        );
    }
}

/**
 * Helper for running insert/update/delete queries
 */
export async function execute(
    sql: string,
    params?: any[]
): Promise<ResultSetHeader> {
    try {
        const [result] = await db.execute<ResultSetHeader>(sql, params);
        return result;
    } catch (error: any) {
        console.error('[Execute] Error:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            throw new AppError(
                ErrorCode.DUPLICATE_ENTRY,
                'This record already exists',
                409
            );
        }

        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Database operation failed',
            500
        );
    }
}

/**
 * Check if a record exists
 */
export async function exists(
    table: string,
    field: string,
    value: any
): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT 1 FROM ${table} WHERE ${field} = ? LIMIT 1`,
        [value]
    );
    return rows.length > 0;
}

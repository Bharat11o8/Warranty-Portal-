import db from '../config/database.js';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

/**
 * Base Repository Class
 * Provides common database operations for all repositories
 */
export abstract class BaseRepository<T> {
    protected tableName: string;
    protected primaryKey: string;

    constructor(tableName: string, primaryKey: string = 'id') {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }

    /**
     * Find a record by its primary key
     */
    async findById(id: string, connection?: PoolConnection): Promise<T | null> {
        const executor = connection || db;
        const [rows] = await executor.execute<RowDataPacket[]>(
            `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
            [id]
        );
        return rows.length > 0 ? (rows[0] as T) : null;
    }

    /**
     * Find all records
     */
    async findAll(connection?: PoolConnection): Promise<T[]> {
        const executor = connection || db;
        const [rows] = await executor.execute<RowDataPacket[]>(
            `SELECT * FROM ${this.tableName}`
        );
        return rows as T[];
    }

    /**
     * Find records by a specific field value
     */
    async findBy(field: string, value: any, connection?: PoolConnection): Promise<T[]> {
        const executor = connection || db;
        const [rows] = await executor.execute<RowDataPacket[]>(
            `SELECT * FROM ${this.tableName} WHERE ${field} = ?`,
            [value]
        );
        return rows as T[];
    }

    /**
     * Find first record matching field value
     */
    async findOneBy(field: string, value: any, connection?: PoolConnection): Promise<T | null> {
        const executor = connection || db;
        const [rows] = await executor.execute<RowDataPacket[]>(
            `SELECT * FROM ${this.tableName} WHERE ${field} = ? LIMIT 1`,
            [value]
        );
        return rows.length > 0 ? (rows[0] as T) : null;
    }

    /**
     * Check if a record exists
     */
    async exists(field: string, value: any, connection?: PoolConnection): Promise<boolean> {
        const executor = connection || db;
        const [rows] = await executor.execute<RowDataPacket[]>(
            `SELECT 1 FROM ${this.tableName} WHERE ${field} = ? LIMIT 1`,
            [value]
        );
        return rows.length > 0;
    }

    /**
     * Count records
     */
    async count(whereClause?: string, params?: any[], connection?: PoolConnection): Promise<number> {
        const executor = connection || db;
        const query = whereClause
            ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`
            : `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const [rows] = await executor.execute<RowDataPacket[]>(query, params || []);
        return rows[0].count;
    }

    /**
     * Delete a record by ID
     */
    async deleteById(id: string, connection?: PoolConnection): Promise<boolean> {
        const executor = connection || db;
        const [result] = await executor.execute<ResultSetHeader>(
            `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Execute a raw query
     */
    protected async query<R extends RowDataPacket[]>(
        sql: string,
        params?: any[],
        connection?: PoolConnection
    ): Promise<R> {
        const executor = connection || db;
        const [rows] = await executor.execute<R>(sql, params);
        return rows;
    }

    /**
     * Execute insert/update/delete
     */
    protected async execute(
        sql: string,
        params?: any[],
        connection?: PoolConnection
    ): Promise<ResultSetHeader> {
        const executor = connection || db;
        const [result] = await executor.execute<ResultSetHeader>(sql, params);
        return result;
    }
}

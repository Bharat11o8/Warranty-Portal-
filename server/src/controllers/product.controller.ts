import { Request, Response } from 'express';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLogService } from '../services/activity-log.service.js';

export class ProductController {
    static async getAllProducts(req: Request, res: Response) {
        try {
            const [products]: any = await db.execute('SELECT * FROM products ORDER BY name ASC');
            res.json({
                success: true,
                products
            });
        } catch (error) {
            console.error('Get all products error:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    static async addProduct(req: Request, res: Response) {
        try {
            const { name, type, warranty_years } = req.body;
            const admin = (req as any).user;

            if (!name || !type || !warranty_years) {
                return res.status(400).json({ error: 'Name, type, and warranty years are required' });
            }

            if (!['seat_cover', 'ev_product'].includes(type)) {
                return res.status(400).json({ error: 'Invalid product type' });
            }

            const id = uuidv4();

            await db.execute(
                'INSERT INTO products (id, name, type, warranty_years) VALUES (?, ?, ?, ?)',
                [id, name, type, warranty_years]
            );

            // Log activity
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'PRODUCT_CREATED',
                targetType: 'PRODUCT',
                targetId: id,
                targetName: name,
                details: { product_type: type, warranty_years },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Product added successfully',
                product: { id, name, type, warranty_years }
            });
        } catch (error) {
            console.error('Add product error:', error);
            res.status(500).json({ error: 'Failed to add product' });
        }
    }

    static async deleteProduct(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const admin = (req as any).user;

            // Get product name before deleting for log
            const [product]: any = await db.execute('SELECT name FROM products WHERE id = ?', [id]);
            const productName = product[0]?.name || 'Unknown Product';

            await db.execute('DELETE FROM products WHERE id = ?', [id]);

            // Log activity
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'PRODUCT_DELETED',
                targetType: 'PRODUCT',
                targetId: id,
                targetName: productName,
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({ error: 'Failed to delete product' });
        }
    }

    static async updateProduct(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, type, warranty_years } = req.body;
            const admin = (req as any).user;

            if (!name || !type || !warranty_years) {
                return res.status(400).json({ error: 'Name, type, and warranty years are required' });
            }

            if (!['seat_cover', 'ev_product'].includes(type)) {
                return res.status(400).json({ error: 'Invalid product type' });
            }

            await db.execute(
                'UPDATE products SET name = ?, type = ?, warranty_years = ? WHERE id = ?',
                [name, type, warranty_years, id]
            );

            // Log activity
            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'PRODUCT_UPDATED',
                targetType: 'PRODUCT',
                targetId: id,
                targetName: name,
                details: { product_type: type, warranty_years },
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Product updated successfully',
                product: { id, name, type, warranty_years }
            });
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({ error: 'Failed to update product' });
        }
    }
}

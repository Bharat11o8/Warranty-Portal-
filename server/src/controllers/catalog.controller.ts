import { Request, Response } from 'express';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLogService } from '../services/activity-log.service.js';
import { NotificationService } from '../services/notification.service.js';



export class CatalogController {
    // PUBLIC ENDPOINTS
    static async getCategories(req: Request, res: Response) {
        try {
            const [categories]: any = await db.execute('SELECT * FROM store_categories ORDER BY name ASC');
            res.json({
                success: true,
                categories: categories.map((c: any) => ({
                    ...c,
                    parentId: c.parent_id // Map snake_case DB to camelCase API
                }))
            });
        } catch (error: any) {
            console.error('Get categories error:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }

    static async getProducts(req: Request, res: Response) {
        try {
            const { categoryId } = req.query;
            let query = 'SELECT * FROM store_products';
            const params: any[] = [];

            if (categoryId) {
                query += ' WHERE category_id = ?';
                params.push(categoryId);
            }

            query += ' ORDER BY created_at DESC';

            const [products]: any = await db.execute(query, params);

            // Fetch relations for all fetched products
            // This prevents N+1 queries.
            if (products.length > 0) {
                const productIds = products.map((p: any) => p.id);
                // Use IN clause safely
                const placeholder = productIds.map(() => '?').join(',');

                // 1. Fetch Variations
                const [variations]: any = await db.query(
                    `SELECT * FROM store_product_variations WHERE product_id IN (${placeholder}) ORDER BY price ASC`,
                    productIds
                );

                // 2. Fetch Images
                const [images]: any = await db.query(
                    `SELECT * FROM store_product_images WHERE product_id IN (${placeholder}) ORDER BY display_order ASC`,
                    productIds
                );

                // 3. Fetch Reviews (Light weight)
                const [reviews]: any = await db.query(
                    `SELECT * FROM store_reviews WHERE product_id IN (${placeholder}) ORDER BY created_at DESC`,
                    productIds
                );

                // Map relations back to products
                // Create lookup maps for performance
                const variationMap = new Map();
                variations.forEach((v: any) => {
                    if (!variationMap.has(v.product_id)) variationMap.set(v.product_id, []);
                    variationMap.get(v.product_id).push({
                        ...v,
                        attributes: typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes,
                        meta: typeof v.meta === 'string' ? JSON.parse(v.meta) : v.meta
                    });
                });

                const imageMap = new Map();
                const variationImageMap = new Map();
                images.forEach((i: any) => {
                    if (i.variation_id) {
                        if (!variationImageMap.has(i.variation_id)) variationImageMap.set(i.variation_id, []);
                        variationImageMap.get(i.variation_id).push(i.url);
                    } else {
                        if (!imageMap.has(i.product_id)) imageMap.set(i.product_id, []);
                        imageMap.get(i.product_id).push(i.url);
                    }
                });

                const reviewMap = new Map();
                reviews.forEach((r: any) => {
                    if (!reviewMap.has(r.product_id)) reviewMap.set(r.product_id, []);
                    reviewMap.get(r.product_id).push({
                        id: r.id,
                        userName: r.user_name,
                        rating: r.rating,
                        comment: r.comment,
                        date: r.created_at
                    });
                });

                // Stitch it all together
                const enrichedProducts = products.map((p: any) => {
                    const productVariations = variationMap.get(p.id) || [];
                    const productImages = imageMap.get(p.id) || [];
                    const productReviews = reviewMap.get(p.id) || [];

                    // Reconstruct complex price object if variations exist
                    let finalPrice: any = Number(p.price);
                    if (productVariations.length > 0) {
                        // Try to detect "twoRow" / "threeRow" pattern from mock data
                        const twoRow = productVariations.find((v: any) => v.name.toLowerCase().includes('2 row'));
                        const threeRow = productVariations.find((v: any) => v.name.toLowerCase().includes('3 row'));

                        if (twoRow || threeRow) {
                            finalPrice = {};
                            if (twoRow) finalPrice.twoRow = Number(twoRow.price);
                            if (threeRow) finalPrice.threeRow = Number(threeRow.price);
                            // Set a default price for general display (min of available rows)
                            const prices = [twoRow?.price, threeRow?.price].filter(p => p !== undefined).map(Number);
                            if (prices.length > 0) finalPrice.default = Math.min(...prices);
                        } else {
                            // If variations exist but are not row-based, use the minimum variation price.
                            // Falling back to product table price only if no valid variation prices found.
                            const varPrices = productVariations.map((v: any) => Number(v.price)).filter((p: number) => p > 0);
                            finalPrice = varPrices.length > 0 ? Math.min(...varPrices) : Number(p.price);
                        }
                    }

                    return {
                        id: p.id,
                        name: p.name,
                        description: p.description ? p.description.split('\n') : [], // Return array for existing frontend
                        price: finalPrice,
                        categoryId: p.category_id,
                        inStock: Boolean(p.in_stock),
                        isFeatured: Boolean(p.is_featured),
                        isNewArrival: Boolean(p.is_new_arrival),
                        additionalInfo: typeof p.additional_info === 'string' ? JSON.parse(p.additional_info) : p.additional_info,
                        images: productImages,
                        reviews: productReviews,
                        rating: 4.5, // Placeholder or avg calc
                        variations: productVariations.map((v: any) => ({
                            ...v,
                            images: variationImageMap.get(v.id) || [],
                            videos: v.meta?.videos || [],
                            description: v.meta?.description || ''
                        }))
                    };
                });

                res.json({ success: true, products: enrichedProducts });
                return;
            }

            res.json({ success: true, products: [] });

        } catch (error: any) {
            console.error('Get products error:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    // Get Single Product by ID
    static async getProductById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const [products]: any = await db.execute(
                'SELECT * FROM store_products WHERE id = ?',
                [id]
            );

            if (products.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            const product = products[0];

            // Fetch related data
            const [variations]: any = await db.query(
                'SELECT * FROM store_product_variations WHERE product_id = ? ORDER BY price ASC',
                [id]
            );
            const [images]: any = await db.query(
                'SELECT * FROM store_product_images WHERE product_id = ? ORDER BY display_order ASC',
                [id]
            );
            const [reviews]: any = await db.query(
                'SELECT * FROM store_reviews WHERE product_id = ? ORDER BY created_at DESC',
                [id]
            );

            // Build response matching frontend expectations
            const productVariations = variations.map((v: any) => ({
                ...v,
                attributes: typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes,
                meta: typeof v.meta === 'string' ? JSON.parse(v.meta) : v.meta
            }));

            let finalPrice: any = Number(product.price);
            if (productVariations.length > 0) {
                const twoRow = productVariations.find((v: any) => v.name.toLowerCase().includes('2 row'));
                const threeRow = productVariations.find((v: any) => v.name.toLowerCase().includes('3 row'));
                if (twoRow || threeRow) {
                    finalPrice = {};
                    if (twoRow) finalPrice.twoRow = Number(twoRow.price);
                    if (threeRow) finalPrice.threeRow = Number(threeRow.price);
                    const prices = [twoRow?.price, threeRow?.price].filter(p => p !== undefined).map(Number);
                    if (prices.length > 0) finalPrice.default = Math.min(...prices);
                } else {
                    const varPrices = productVariations.map((v: any) => Number(v.price)).filter((p: number) => p > 0);
                    if (varPrices.length > 0) {
                        finalPrice = Math.min(...varPrices);
                    }
                }
            }

            res.json({
                success: true,
                product: {
                    id: product.id,
                    name: product.name,
                    description: product.description ? product.description.split('\n') : [],
                    price: finalPrice,
                    categoryId: product.category_id,
                    inStock: Boolean(product.in_stock),
                    isFeatured: Boolean(product.is_featured),
                    isNewArrival: Boolean(product.is_new_arrival),
                    additionalInfo: typeof product.additional_info === 'string' ? JSON.parse(product.additional_info) : product.additional_info,
                    images: images.map((i: any) => i.url),
                    reviews: reviews.map((r: any) => ({
                        id: r.id,
                        userName: r.user_name,
                        rating: r.rating,
                        comment: r.comment,
                        date: r.created_at
                    })),
                    rating: 4.5,
                    variations: productVariations.map((v: any) => ({
                        ...v,
                        images: images.filter((i: any) => i.variation_id === v.id).map((i: any) => i.url) || [],
                        videos: v.meta?.videos || [],
                        description: v.meta?.description || ''
                    }))
                }
            });
        } catch (error: any) {
            console.error('Get product by ID error:', error);
            res.status(500).json({ error: 'Failed to fetch product' });
        }
    }

    // ===================== ADMIN ENDPOINTS =====================

    // Add Category
    static async addCategory(req: Request, res: Response) {
        try {
            const { name, description, image, parentId } = req.body;
            const admin = (req as any).user;

            if (!name) {
                return res.status(400).json({ error: 'Category name is required' });
            }

            const id = uuidv4();

            await db.execute(
                'INSERT INTO store_categories (id, name, description, image, parent_id) VALUES (?, ?, ?, ?, ?)',
                [id, name, description || null, image || null, parentId || null]
            );

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'STORE_CATEGORY_CREATED',
                targetType: 'STORE_CATEGORY',
                targetId: id,
                targetName: name,
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Category created successfully',
                category: { id, name, description, image, parentId }
            });
        } catch (error: any) {
            console.error('Add category error:', error);
            res.status(500).json({ error: 'Failed to create category' });
        }
    }

    // Update Category
    static async updateCategory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, image, parentId } = req.body;
            const admin = (req as any).user;

            if (!name) {
                return res.status(400).json({ error: 'Category name is required' });
            }

            await db.execute(
                'UPDATE store_categories SET name = ?, description = ?, image = ?, parent_id = ? WHERE id = ?',
                [name, description || null, image || null, parentId || null, id]
            );

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'STORE_CATEGORY_UPDATED',
                targetType: 'STORE_CATEGORY',
                targetId: id,
                targetName: name,
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({ success: true, message: 'Category updated successfully' });
        } catch (error: any) {
            console.error('Update category error:', error);
            res.status(500).json({ error: 'Failed to update category' });
        }
    }

    // Delete Category
    static async deleteCategory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const admin = (req as any).user;

            // Get category name before deleting
            const [cat]: any = await db.execute('SELECT name FROM store_categories WHERE id = ?', [id]);
            const categoryName = cat[0]?.name || 'Unknown';

            await db.execute('DELETE FROM store_categories WHERE id = ?', [id]);

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'STORE_CATEGORY_DELETED',
                targetType: 'STORE_CATEGORY',
                targetId: id,
                targetName: categoryName,
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({ success: true, message: 'Category deleted successfully' });
        } catch (error: any) {
            console.error('Delete category error:', error);
            res.status(500).json({ error: 'Failed to delete category' });
        }
    }

    // Add Product (with variations and images)
    static async addProduct(req: Request, res: Response) {
        try {
            const { name, description, price, categoryId, inStock, additionalInfo, images, variations } = req.body;
            const admin = (req as any).user;

            if (!name) {
                return res.status(400).json({ error: 'Product name is required' });
            }

            const id = uuidv4();
            const descriptionText = Array.isArray(description) ? description.join('\n') : description;

            // Determine base price: if it's an object (legacy seat covers), use the minimum. 
            // Otherwise, use the provided price value directly.
            let basePrice = 0;
            if (price && typeof price === 'object') {
                basePrice = Math.min(price.twoRow || 0, price.threeRow || 0);
            } else if (price !== undefined) {
                basePrice = Number(price);
            }

            // Insert main product
            await db.execute(
                `INSERT INTO store_products (id, name, description, price, category_id, in_stock, is_featured, is_new_arrival, additional_info, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, name, descriptionText, basePrice, categoryId || null, inStock ? 1 : 0, req.body.isFeatured ? 1 : 0, req.body.isNewArrival ? 1 : 0, JSON.stringify(additionalInfo || []), 1]
            );

            // Insert variations if provided
            if (variations && variations.length > 0) {
                for (const v of variations) {
                    const varId = uuidv4();
                    const meta = {
                        ...(v.meta || {}),
                        description: v.description || null,
                        videos: v.videos || []
                    };
                    await db.execute(
                        `INSERT INTO store_product_variations (id, product_id, name, sku, price, stock_quantity, attributes, meta) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [varId, id, v.name, v.sku || null, v.price, v.stockQuantity || 10, JSON.stringify(v.attributes || {}), JSON.stringify(meta)]
                    );

                    // Insert variation specific images
                    if (v.images && v.images.length > 0) {
                        for (let j = 0; j < v.images.length; j++) {
                            await db.execute(
                                `INSERT INTO store_product_images (id, product_id, variation_id, url, display_order) VALUES (?, ?, ?, ?, ?)`,
                                [uuidv4(), id, varId, v.images[j], j]
                            );
                        }
                    }
                }
            } else if (typeof price === 'object') {
                // Auto-create variations from price object (Legacy seat cover support)
                if (price.twoRow) {
                    await db.execute(
                        `INSERT INTO store_product_variations (id, product_id, name, price, stock_quantity, attributes, meta) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [uuidv4(), id, '2 Row', price.twoRow, 10, JSON.stringify({ "Row Type": "2 Row" }), '{}']
                    );
                }
                if (price.threeRow) {
                    await db.execute(
                        `INSERT INTO store_product_variations (id, product_id, name, price, stock_quantity, attributes, meta) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [uuidv4(), id, '3 Row', price.threeRow, 10, JSON.stringify({ "Row Type": "3 Row" }), '{}']
                    );
                }
            }

            // Insert images if provided
            if (images && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    await db.execute(
                        `INSERT INTO store_product_images (id, product_id, url, display_order, is_primary) VALUES (?, ?, ?, ?, ?)`,
                        [uuidv4(), id, images[i], i, i === 0]
                    );
                }
            }

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'STORE_PRODUCT_CREATED',
                targetType: 'STORE_PRODUCT',
                targetId: id,
                targetName: name,
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({
                success: true,
                message: 'Product created successfully',
                product: { id, name }
            });

            // Notify Vendors about the new product
            try {
                await NotificationService.broadcast({
                    title: 'New Product Launch! 🚀',
                    message: `Check out our new product: ${name}`,
                    type: 'product',
                    link: `/product/${id}`,
                    metadata: {
                        images: images && images.length > 0 ? [images[0]] : []
                    },
                    targetRole: 'vendor'
                });
            } catch (notifError) {
                console.error('Failed to broadcast new product notification:', notifError);
            }
        } catch (error: any) {
            console.error('Add product error:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }

    // Update Product
    static async updateProduct(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, price, categoryId, inStock, additionalInfo, images, variations } = req.body;
            const admin = (req as any).user;

            if (!name) {
                return res.status(400).json({ error: 'Product name is required' });
            }

            const descriptionText = Array.isArray(description) ? description.join('\n') : description;

            // Determine base price: prioritize the explicit price passed from frontend.
            let basePrice = 0;
            if (price && typeof price === 'object') {
                basePrice = Math.min(price.twoRow || 0, price.threeRow || 0);
            } else if (price !== undefined) {
                basePrice = Number(price);
            }

            // Update main product
            await db.execute(
                `UPDATE store_products SET name = ?, description = ?, price = ?, category_id = ?, in_stock = ?, is_featured = ?, is_new_arrival = ?, additional_info = ? WHERE id = ?`,
                [name, descriptionText, basePrice, categoryId || null, inStock ? 1 : 0, req.body.isFeatured ? 1 : 0, req.body.isNewArrival ? 1 : 0, JSON.stringify(additionalInfo || []), id]
            );

            // Clear legacy data
            await db.execute('DELETE FROM store_product_variations WHERE product_id = ?', [id]);
            await db.execute('DELETE FROM store_product_images WHERE product_id = ?', [id]);

            // Re-insert variations
            if (variations && variations.length > 0) {
                for (const v of variations) {
                    const varId = uuidv4();
                    const meta = {
                        ...(v.meta || {}),
                        description: v.description || null,
                        videos: v.videos || []
                    };
                    await db.execute(
                        `INSERT INTO store_product_variations (id, product_id, name, sku, price, stock_quantity, attributes, meta) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [varId, id, v.name, v.sku || null, v.price, v.stockQuantity || 10, JSON.stringify(v.attributes || {}), JSON.stringify(meta)]
                    );

                    // Re-insert variation specific images
                    if (v.images && v.images.length > 0) {
                        for (let j = 0; j < v.images.length; j++) {
                            await db.execute(
                                `INSERT INTO store_product_images (id, product_id, variation_id, url, display_order) VALUES (?, ?, ?, ?, ?)`,
                                [uuidv4(), id, varId, v.images[j], j]
                            );
                        }
                    }
                }
            } else if (typeof price === 'object') {
                if (price.twoRow) {
                    await db.execute(
                        `INSERT INTO store_product_variations (id, product_id, name, price, stock_quantity, attributes, meta) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [uuidv4(), id, '2 Row', price.twoRow, 10, JSON.stringify({ "Row Type": "2 Row" }), '{}']
                    );
                }
                if (price.threeRow) {
                    await db.execute(
                        `INSERT INTO store_product_variations (id, product_id, name, price, stock_quantity, attributes, meta) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [uuidv4(), id, '3 Row', price.threeRow, 10, JSON.stringify({ "Row Type": "3 Row" }), '{}']
                    );
                }
            }

            // Re-insert product-level images (only if not already re-inserted by variations)
            if (images && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    await db.execute(
                        `INSERT INTO store_product_images (id, product_id, url, display_order, is_primary) VALUES (?, ?, ?, ?, ?)`,
                        [uuidv4(), id, images[i], i, i === 0]
                    );
                }
            }

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'STORE_PRODUCT_UPDATED',
                targetType: 'STORE_PRODUCT',
                targetId: id,
                targetName: name,
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({ success: true, message: 'Product updated successfully' });

            // Notify Vendors about product update (optional, maybe only for major updates or price changes)
            // For now, let's notify if it's featured or new arrival status changes, or just general update
            try {
                await NotificationService.broadcast({
                    title: 'Product Update 🔔',
                    message: `${name} details have been updated. Check it out!`,
                    type: 'product',
                    link: `/product/${id}`,
                    targetRole: 'vendor'
                });
            } catch (notifError) {
                console.error('Failed to broadcast product update notification:', notifError);
            }
        } catch (error: any) {
            console.error('Update product error:', error);
            res.status(500).json({ error: 'Failed to update product' });
        }
    }

    // Delete Product
    static async deleteProduct(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const admin = (req as any).user;

            // Get product name before deleting
            const [prod]: any = await db.execute('SELECT name FROM store_products WHERE id = ?', [id]);
            const productName = prod[0]?.name || 'Unknown';

            // Delete will cascade to variations, images, reviews due to FK constraints
            await db.execute('DELETE FROM store_products WHERE id = ?', [id]);

            await ActivityLogService.log({
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
                actionType: 'STORE_PRODUCT_DELETED',
                targetType: 'STORE_PRODUCT',
                targetId: id,
                targetName: productName,
                ipAddress: req.ip || req.socket?.remoteAddress
            });

            res.json({ success: true, message: 'Product deleted successfully' });
        } catch (error: any) {
            console.error('Delete product error:', error);
            res.status(500).json({ error: 'Failed to delete product' });
        }
    }
}

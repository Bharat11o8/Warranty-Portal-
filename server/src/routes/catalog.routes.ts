import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller.js';


import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js';


const router = Router();


// Public routes
router.get('/categories', CatalogController.getCategories);
router.get('/products', CatalogController.getProducts);
router.get('/products/:id', CatalogController.getProductById);



// Admin routes - Categories
router.post('/categories', authenticateToken, requireRole('admin'), requirePermission('ecatalogue', 'write'), CatalogController.addCategory);
router.put('/categories/:id', authenticateToken, requireRole('admin'), requirePermission('ecatalogue', 'write'), CatalogController.updateCategory);
router.delete('/categories/:id', authenticateToken, requireRole('admin'), requirePermission('ecatalogue', 'write'), CatalogController.deleteCategory);

// Admin routes - Products
router.post('/products', authenticateToken, requireRole('admin'), requirePermission('ecatalogue', 'write'), CatalogController.addProduct);
router.put('/products/:id', authenticateToken, requireRole('admin'), requirePermission('ecatalogue', 'write'), CatalogController.updateProduct);
router.delete('/products/:id', authenticateToken, requireRole('admin'), requirePermission('ecatalogue', 'write'), CatalogController.deleteProduct);

export default router;



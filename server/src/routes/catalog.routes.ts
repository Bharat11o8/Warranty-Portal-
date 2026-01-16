import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller.js';


import { authenticateToken, requireRole } from '../middleware/auth.js';


const router = Router();


// Public routes
router.get('/categories', CatalogController.getCategories);
router.get('/products', CatalogController.getProducts);
router.get('/products/:id', CatalogController.getProductById);



// Admin routes - Categories
router.post('/categories', authenticateToken, requireRole('admin'), CatalogController.addCategory);
router.put('/categories/:id', authenticateToken, requireRole('admin'), CatalogController.updateCategory);
router.delete('/categories/:id', authenticateToken, requireRole('admin'), CatalogController.deleteCategory);

// Admin routes - Products
router.post('/products', authenticateToken, requireRole('admin'), CatalogController.addProduct);
router.put('/products/:id', authenticateToken, requireRole('admin'), CatalogController.updateProduct);
router.delete('/products/:id', authenticateToken, requireRole('admin'), CatalogController.deleteProduct);

export default router;



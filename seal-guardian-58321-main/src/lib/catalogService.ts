import api from './api';

// Types matching backend response
export interface Category {
    id: string;
    name: string;
    description?: string;
    image?: string;
    parentId?: string;
}

export interface ProductVariation {
    id: string;
    name: string;
    price: number;
    sku?: string;
    stockQuantity?: number;
    attributes?: Record<string, string>;
    meta?: Record<string, any>;
    images: string[];
    videos?: string[];
}

export interface ProductReview {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
}

export interface Product {
    id: string;
    name: string;
    description: string[];
    price: number | { twoRow?: number; threeRow?: number };
    categoryId: string;
    inStock: boolean;
    images: string[];
    videos?: string[];
    reviews: ProductReview[];
    rating: number;
    variations?: ProductVariation[];
    additionalInfo?: string[];
}

// Cache to reduce API calls
let categoriesCache: Category[] | null = null;
let productsCacheTimestamp = 0;
let productsCache: Product[] | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ===================== PUBLIC API =====================

export async function fetchCategories(): Promise<Category[]> {
    if (categoriesCache) return categoriesCache;

    try {
        const res = await api.get('/catalog/categories');
        if (res.data.success) {
            categoriesCache = res.data.categories;
            return categoriesCache;
        }
    } catch (error) {
        console.error('Failed to fetch categories:', error);
    }
    return [];
}

export async function fetchProducts(): Promise<Product[]> {
    const now = Date.now();
    if (productsCache && (now - productsCacheTimestamp) < CACHE_TTL) {
        return productsCache;
    }

    try {
        const res = await api.get('/catalog/products');
        if (res.data.success) {
            productsCache = res.data.products;
            productsCacheTimestamp = now;
            return productsCache;
        }
    } catch (error) {
        console.error('Failed to fetch products:', error);
    }
    return [];
}

export async function fetchProductById(id: string): Promise<Product | null> {
    try {
        const res = await api.get(`/catalog/products/${id}`);
        if (res.data.success) {
            return res.data.product;
        }
    } catch (error) {
        console.error('Failed to fetch product:', error);
    }
    return null;
}

export async function fetchProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
        const res = await api.get(`/catalog/products?categoryId=${categoryId}`);
        if (res.data.success) {
            return res.data.products;
        }
    } catch (error) {
        console.error('Failed to fetch products by category:', error);
    }
    return [];
}

// ===================== HELPER FUNCTIONS =====================

export async function getMainCategories(): Promise<Category[]> {
    const categories = await fetchCategories();
    return categories.filter(c => !c.parentId);
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
    const categories = await fetchCategories();
    return categories.filter(c => c.parentId === parentId);
}

export async function getCategory(id: string): Promise<Category | undefined> {
    const categories = await fetchCategories();
    return categories.find(c => c.id === id);
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4): Promise<Product[]> {
    const products = await fetchProducts();
    return products
        .filter(p => p.id !== productId && p.categoryId === categoryId)
        .slice(0, limit);
}

export async function getProductsByDeepCategory(categoryId: string): Promise<Product[]> {
    const categories = await fetchCategories();
    const products = await fetchProducts();

    // Get all child category IDs recursively
    const getAllChildIds = (parentId: string): string[] => {
        const directChildren = categories.filter(c => c.parentId === parentId);
        const childIds = directChildren.map(c => c.id);
        const grandchildIds = directChildren.flatMap(c => getAllChildIds(c.id));
        return [...childIds, ...grandchildIds];
    };

    const relevantCategoryIds = [categoryId, ...getAllChildIds(categoryId)];
    return products.filter(p => relevantCategoryIds.includes(p.categoryId));
}

// Clear cache (useful after admin updates)
export function clearCatalogCache() {
    categoriesCache = null;
    productsCache = null;
    productsCacheTimestamp = 0;
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductsByCategory, getSubcategories, fetchCategories, getCategory, Product, Category, fetchProducts } from '@/lib/catalogService';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import CatalogHeader from '@/components/eshop/CatalogHeader';
import { ChevronRight, Loader2 } from 'lucide-react';

const CategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  // Virtual category for New Arrivals
  const isNewArrivals = categoryId === 'new-arrivals';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (isNewArrivals) {
          const allProducts = await fetchProducts();
          setCategory({ id: 'new-arrivals', name: 'New Arrivals', description: 'Experience our latest automotive innovations' });
          // Sort by date and take first 8 as "New Arrivals"
          const sorted = [...allProducts].sort((a, b) => {
            const dateA = a.id.includes('new') ? 1 : 0; // Or use created_at if available
            const dateB = b.id.includes('new') ? 1 : 0;
            return dateB - dateA;
          }).slice(0, 8);
          setProducts(sorted);
        } else if (categoryId) {
          const [cat, prods, subs] = await Promise.all([
            getCategory(categoryId),
            fetchProductsByCategory(categoryId),
            getSubcategories(categoryId)
          ]);

          if (cat) {
            setCategory(cat);
            setProducts(prods);
            setSubcategories(subs);

            if (cat.parentId) {
              const parent = await getCategory(cat.parentId);
              setParentCategory(parent || null);
            }
          }
        }
      } catch (error) {
        console.error("Error loading category page data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId, isNewArrivals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!category) {
    return <div className="text-center py-20 text-2xl font-bold">Category not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="container mx-auto py-8 space-y-6">
        {/* Breadcrumbs */}
        <div className="text-sm breadcrumbs">
          <ul className="flex items-center space-x-2">
            <li>
              <Link to="/dashboard/vendor" className="text-muted-foreground hover:text-foreground">
                Catalogue
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {parentCategory && (
              <>
                <li>
                  <Link
                    to={`/category/${parentCategory.id}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {parentCategory.name}
                  </Link>
                </li>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
            <li className="font-medium">{category.name}</li>
          </ul>
        </div>

        {/* Category Header */}
        <div className="glass-card-premium rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-gray-600">{category.description}</p>
          )}
        </div>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Browse {category.name} Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {subcategories.map(subcategory => (
                <CategoryCard key={subcategory.id} category={subcategory} />
              ))}
            </div>
          </section>
        )}

        {/* Products Section */}
        <section>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : subcategories.length === 0 ? (
            <div className="flex justify-center items-center h-48 bg-muted rounded-lg">
              <p className="text-2xl font-semibold text-muted-foreground">Coming Soon!</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default CategoryPage;

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProductsByCategory, getSubcategories, fetchCategories, getCategory, Product, Category, fetchProducts } from '@/lib/catalogService';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import CatalogHeader from '@/components/eshop/CatalogHeader';
import { ChevronRight, Loader2 } from 'lucide-react';

interface CategoryPageProps {
  categoryId?: string;
  embedded?: boolean;
  isDashboard?: boolean;
}

const CategoryPage: React.FC<CategoryPageProps> = ({ categoryId: propCategoryId, embedded = false, isDashboard = false }) => {
  const { categoryId: paramsCategoryId } = useParams<{ categoryId: string }>();
  const categoryId = propCategoryId || paramsCategoryId;

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
    return (
      <div className="bg-white min-h-screen text-center">
        <CatalogHeader isDashboard={isDashboard} />
        <div className="text-2xl font-bold py-20 text-gray-900">Category not found</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <CatalogHeader isDashboard={isDashboard} />
      <div className={`container mx-auto px-4 ${embedded ? 'py-4' : 'py-8'} space-y-6`}>
        {/* Breadcrumbs */}
        <div className="text-sm overflow-x-auto no-scrollbar py-2">
          <ul className="flex items-center space-x-2 whitespace-nowrap">
            <li className="flex items-center gap-2">
              <Link to="/catalogue" className="text-muted-foreground hover:text-brand-orange transition-colors font-medium">
                Catalogue
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-300" />
            </li>
            {parentCategory && (
              <li className="flex items-center gap-2">
                <Link
                  to={`/category/${parentCategory.id}`}
                  className="text-muted-foreground hover:text-brand-orange transition-colors font-medium"
                >
                  {parentCategory.name}
                </Link>
                <ChevronRight className="h-3 w-3 text-slate-300" />
              </li>
            )}
            <li className="font-bold text-slate-900 truncate max-w-[200px] md:max-w-[400px]" title={category.name}>
              {category.name}
            </li>
          </ul>
        </div>

        {/* Premium Clean Category Header */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-orange-50/20 p-6 md:p-8 mb-8 border border-orange-100/50 group/hero">
          {/* Subtle Decorative Accents */}
          <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-white to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-100/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            {/* Split Title Style (Related Products Style) */}
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">
              {(() => {
                if (parentCategory) {
                  return (
                    <>
                      <span className="mr-2 uppercase">{category.name}</span>
                      <span className="text-brand-orange/90 font-medium italic normal-case">
                        {parentCategory.name}
                      </span>
                    </>
                  );
                }

                // Fallback for single-level categories: split by first word
                const parts = category.name.split(' ');
                const firstPart = parts[0];
                const restPart = parts.slice(1).join(' ');

                return (
                  <>
                    <span className="mr-2 uppercase">{firstPart}</span>
                    <span className="text-brand-orange/90 font-medium italic normal-case">
                      {restPart}
                    </span>
                  </>
                );
              })()}
            </h1>

            <div className="flex items-center mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Category Overview</span>
            </div>
            {category.description && (
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium max-w-2xl opacity-70">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Subcategories Section */}
        {subcategories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Browse Categories</h2>
              <div className="h-px bg-slate-100 flex-1" />
            </div>
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

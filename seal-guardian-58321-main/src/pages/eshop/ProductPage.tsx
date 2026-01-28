import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProductById, getRelatedProducts, getCategory, Product, Category } from '@/lib/catalogService';

import ProductBreadcrumbs from '@/components/product/ProductBreadcrumbs';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductRating from '@/components/product/ProductRating';
import ProductActions from '@/components/product/ProductActions';
import ProductDetailTabs from '@/components/product/ProductDetailTabs';
import RelatedProducts from '@/components/product/RelatedProducts';
import { Loader2 } from 'lucide-react';
import CatalogHeader from '@/components/eshop/CatalogHeader';

const ProductPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const prod = await fetchProductById(productId);
        if (prod) {
          setProduct(prod);
          if (prod.variations && prod.variations.length > 0) {
            setSelectedVariation(prod.variations[0]);
          }

          // Load category and related products
          const [cat, related] = await Promise.all([
            getCategory(prod.categoryId),
            getRelatedProducts(prod.id, prod.categoryId)
          ]);

          setCategory(cat);
          setRelatedProducts(related);

          // Load parent category if exists
          if (cat?.parentId) {
            const parent = await getCategory(cat.parentId);
            setParentCategory(parent || null);
          }
        }
      } catch (error) {
        console.error("Error loading product page data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-white">
        <CatalogHeader />
        <div className="py-20">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Product Not Found</h2>
          <Link to="/dashboard/vendor" className="text-brand-orange hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Dynamic content based on variation
  const variationImages = selectedVariation?.images?.length > 0 ? selectedVariation.images : product.images;
  const variationDescriptionText = selectedVariation?.meta?.description || (Array.isArray(product.description) ? product.description.join('\n') : product.description);
  const descriptionArray = variationDescriptionText?.split('\n').filter((line: string) => line.trim() !== '') || [];

  const additionalInfoArray = Array.isArray(product.additionalInfo)
    ? product.additionalInfo
    : typeof (product.additionalInfo as any) === 'string'
      ? (product.additionalInfo as any).split('\n').filter((line: string) => line.trim() !== '')
      : [];

  // ✅ List of product IDs that need "Onward"
  const onwardPriceProductIds = [
    'led-head-lamp-for-carE',
    'led-fog-lampE',
    'car-mobile-chargerE',
    'snail-horn',
    'led-fog-lamp',
    'led-head-lamp-for-car',
    'car-charger',
    'snail-hornu'
  ];

  const showPriceOnward = onwardPriceProductIds.includes(product.id);

  return (
    <div className="space-y-6">
      <div className="container mx-auto py-8 space-y-6">
        {/* Breadcrumbs */}
        <ProductBreadcrumbs
          productName={product.name}
          category={category}
          parentCategory={parentCategory}
        />

        {/* Product Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Product Images */}
          <ProductImageGallery
            images={variationImages}
            productName={product.name}
          />

          {/* Product Info */}
          <div className="glass-card-premium rounded-3xl p-6 md:p-8 !transform-none hover:!transform-none border border-gray-100 shadow-sm">
            <h1 className="text-2xl md:text-4xl font-black mb-4 text-gray-900 tracking-tighter leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="mb-6">
              <ProductRating
                rating={product.rating}
                reviewCount={product.reviews?.length || 0}
                size="md"
              />
            </div>

            {/* Price display updated for variations */}
            <div className="mb-8">
              {selectedVariation ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Price</span>
                  <p className="text-2xl md:text-3xl font-black text-brand-orange">
                    ₹{Number(selectedVariation.price).toLocaleString()}{' '}
                    {showPriceOnward && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle ml-2">From</span>
                    )}
                  </p>
                </div>
              ) : typeof product.price === 'number' ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Price</span>
                  <p className="text-2xl md:text-3xl font-black text-brand-orange">
                    ₹{Number(product.price).toLocaleString()}{' '}
                    {showPriceOnward && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider align-middle ml-2">From</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest min-w-[60px]">2 Row</span>
                    <p className="text-xl md:text-2xl font-black text-brand-orange">
                      ₹{Number(product.price.twoRow).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest min-w-[60px]">3 Row</span>
                    <p className="text-xl md:text-2xl font-black text-brand-orange">
                      ₹{Number(product.price.threeRow).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Variation Selector */}
            {product.variations && product.variations.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">Select Variation:</p>
                <div className="flex flex-wrap gap-2">
                  {product.variations.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariation(v)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedVariation?.id === v.id
                        ? 'bg-brand-orange text-white shadow-md ring-2 ring-brand-orange ring-offset-2'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange'
                        }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ Description as bullet list */}
            {descriptionArray.length > 0 && (
              <ul className="list-disc list-inside mb-6 space-y-1 text-sm text-gray-700">
                {descriptionArray.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}

            {/* Available Colors */}
            {typeof product.additionalInfo === 'object' && (product.additionalInfo as any)?.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-2">Available Colors:</p>
                <div className="flex flex-wrap gap-2">
                  {(product.additionalInfo as any).colors.map((color: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs border border-gray-200 shadow-sm"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product actions */}
            <ProductActions
              productId={product.id}
              productName={product.name}
              price={selectedVariation?.price || (typeof product.price === 'number' ? product.price : product.price.twoRow)}
              inStock={product.inStock}
            />
          </div>
        </div>

        {/* Product Details Tabs */}
        <ProductDetailTabs
          description={descriptionArray}
          additionalInfo={additionalInfoArray}
        />

        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
};

export default ProductPage;

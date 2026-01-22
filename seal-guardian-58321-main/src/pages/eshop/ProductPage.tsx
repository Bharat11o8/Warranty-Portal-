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
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link to="/dashboard/vendor" className="text-brand-orange hover:underline">
          Return to Dashboard
        </Link>
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
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back to Dashboard */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/dashboard/vendor?tab=catalog');
            }
          }}
          className="inline-flex items-center text-sm text-brand-orange hover:underline bg-transparent border-none p-0 cursor-pointer"
        >
          ← Back to Dashboard
        </button>

        {/* Breadcrumbs */}
        <ProductBreadcrumbs
          productName={product.name}
          category={category}
          parentCategory={parentCategory}
        />

        {/* Product Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <ProductImageGallery
            images={variationImages}
            productName={product.name}
          />

          {/* Product Info */}
          <div className="glass-card-premium rounded-2xl p-6 !transform-none hover:!transform-none">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{product.name}</h1>

            {/* Rating */}
            <div className="mb-4">
              <ProductRating
                rating={product.rating}
                reviewCount={product.reviews?.length || 0}
              />
            </div>

            {/* Price display updated for variations */}
            <div className="mb-6">
              {selectedVariation ? (
                <p className="text-2xl font-bold text-primary">
                  <span className="text-sm text-black">Price: </span>
                  ₹{Number(selectedVariation.price).toFixed(2)}{' '}
                  {showPriceOnward && (
                    <span className="text-xs text-gray-500 align-middle">Onwards</span>
                  )}
                </p>
              ) : typeof product.price === 'number' ? (
                <p className="text-2xl font-bold text-primary">
                  <span className="text-sm text-black">Price: </span>
                  ₹{Number(product.price).toFixed(2)}{' '}
                  {showPriceOnward && (
                    <span className="text-xs text-gray-500 align-middle">Onwards</span>
                  )}
                </p>
              ) : (
                <div className="text-2xl font-bold text-primary space-y-1">
                  <p>
                    <span className="text-sm text-black">2 Row Price: </span>
                    ₹{Number(product.price.twoRow).toFixed(2)}{' '}
                  </p>
                  <p>
                    <span className="text-sm text-black">3 Row Price: </span>
                    ₹{Number(product.price.threeRow).toFixed(2)}{' '}
                  </p>
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

            {/* Stock status */}
            {/* <div className="mb-6">
            <span
              className={`px-2 py-1 text-sm rounded-full ${product.inStock
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              }`}
            >
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div> */}

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

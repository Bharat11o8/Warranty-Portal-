import React from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductPrice } from '@/types/catalog';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Check if the product has multiple prices (2-row and/or 3-row)
  const hasMultiplePrices =
    typeof product.price === 'object' &&
    (product.price.twoRow || product.price.threeRow);

  // List of product IDs that need "Price Onward"
  const onwardPriceProductIds = [
    'led-head-lamp-for-carE',
    'led-fog-lampE',
    'car-mobile-chargerE',
    'snail-horn',
    'car-charger',
    'led-head-lamp-for-car',
    'led-fog-lamp',
    'snail-hornu'
  ];

  const showPriceOnward = onwardPriceProductIds.includes(product.id);

  return (
    <Link to={`/product/${product.id}`} className="group block h-full">
      <div className="glass-card-premium rounded-2xl h-full flex flex-col relative overflow-visible">
        {/* Swinging NEW Tag - Only if no rating (treated as New) or explicitly new */}
        {!product.rating && (
          <div className="hanging-tag">
            <div className="hanging-tag-body">NEW</div>
          </div>
        )}

        {/* Product Image */}
        <AspectRatio ratio={1 / 1} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="object-contain w-full h-full p-4 transition-transform duration-500 group-hover:scale-110"
          />
        </AspectRatio>

        {/* Product Details */}
        <div className="p-5 flex-grow flex flex-col">
          {/* Rating */}
          <div className="flex items-center mb-3">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.round(product.rating || 0)
                  ? 'text-brand-yellow'
                  : 'text-gray-300'
                  }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            {product.rating && (
              <span className="ml-1 text-xs text-gray-500">
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 mb-3 group-hover:text-brand-orange transition-colors">
            {product.name}
          </h3>

          {/* Price Display */}
          <div className="mt-auto">
            {hasMultiplePrices ? (
              <div className="text-brand-orange font-bold space-y-1 text-sm">
                {(product.price as ProductPrice).twoRow && (
                  <p>
                    2 Row: ₹{(product.price as ProductPrice).twoRow?.toLocaleString()}{' '}
                    {showPriceOnward && <span className="text-gray-500 font-normal">onwards</span>}
                  </p>
                )}
                {(product.price as ProductPrice).threeRow && (
                  <p>
                    3 Row: ₹{(product.price as ProductPrice).threeRow?.toLocaleString()}{' '}
                    {showPriceOnward && <span className="text-gray-500 font-normal">onwards</span>}
                  </p>
                )}
              </div>
            ) : (
              <p className="font-bold text-brand-orange text-lg">
                ₹{typeof product.price === 'number'
                  ? product.price.toLocaleString()
                  : product.price.default?.toLocaleString()}{' '}
                {showPriceOnward && <span className="text-gray-500 font-normal text-sm">onwards</span>}
              </p>
            )}
          </div>

          {/* Stock Status */}
          {!product.inStock && (
            <div className="mt-2 text-sm text-red-500 font-medium">Out of stock</div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

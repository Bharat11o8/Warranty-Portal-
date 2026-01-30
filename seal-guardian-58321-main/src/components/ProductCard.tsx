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
            <div className="bg-white rounded-[32px] h-full flex flex-col relative overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 group">
                {/* Swinging NEW Tag - Only if no rating (treated as New) or explicitly new */}
                {!product.rating && (
                    <div className="hanging-tag">
                        <div className="hanging-tag-body"></div>
                    </div>
                )}

                {/* Product Image Area */}
                <AspectRatio ratio={1 / 1} className="bg-gray-50/50 rounded-t-[32px] overflow-hidden group-hover:bg-gray-100/50 transition-colors duration-500">
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="object-contain w-full h-full p-6 transition-transform duration-700 group-hover:scale-110"
                    />
                </AspectRatio>

                {/* Product Details */}
                <div className="p-6 flex-grow flex flex-col items-start text-left gap-4">

                    <div className="space-y-2 w-full">
                        {/* Product Name - Bolder and Natural Wrap on Mobile, Elegant on Desktop */}
                        <h3 className="text-xl md:text-lg font-black text-brand-orange md:text-gray-900 leading-[1.2] tracking-tight group-hover:text-brand-orange transition-colors">
                            {product.name}
                        </h3>

                        {/* Product Description - More elegant spacing */}
                        {product.description && (
                            <p className="text-xs md:text-sm text-gray-400 font-medium line-clamp-3 leading-snug">
                                {Array.isArray(product.description)
                                    ? product.description[0]
                                    : product.description.split('\n')[0]}
                            </p>
                        )}
                    </div>

                    {/* Footer Row: Price Pill & Enhanced Action */}
                    <div className="mt-auto pt-6 w-full flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            {hasMultiplePrices ? (
                                <div className="flex flex-col gap-2">
                                    {(product.price as ProductPrice).twoRow && (
                                        <div className="px-4 py-2 bg-gray-100 rounded-full flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">2 Row</span>
                                            <span className="text-base font-black text-brand-orange">₹{(product.price as ProductPrice).twoRow?.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {(product.price as ProductPrice).threeRow && (
                                        <div className="px-4 py-2 bg-gray-100 rounded-full flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">3 Row</span>
                                            <span className="text-base font-black text-brand-orange">₹{(product.price as ProductPrice).threeRow?.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="px-5 py-2.5 bg-gray-100 rounded-full flex items-center gap-2">
                                    {showPriceOnward && (
                                        <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">From</span>
                                    )}
                                    <span className="text-base md:text-lg font-black text-brand-orange">
                                        ₹{typeof product.price === 'number'
                                            ? product.price.toLocaleString()
                                            : typeof product.price === 'string'
                                                ? Number(product.price).toLocaleString()
                                                : (product.price as any).default?.toLocaleString() || (product.price as any).twoRow?.toLocaleString() || '0'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Enhanced Action Icon - High Impact for Mobile */}
                        <div className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-brand-orange md:bg-gray-900 text-white flex items-center justify-center transform transition-all duration-300 group-hover:bg-brand-orange group-hover:translate-x-1 group-hover:shadow-lg shadow-md md:shadow-none">
                            <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7M3 12h18" />
                            </svg>
                        </div>
                    </div>
                </div>
                {/* Stock Status */}
                {!product.inStock && (
                    <div className="mt-2 text-sm text-red-500 font-medium pb-4">Out of stock</div>
                )}
            </div>
        </Link>
    );
};

export default ProductCard;

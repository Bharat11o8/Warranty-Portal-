import React from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductPrice } from '@/types/catalog';
import ScrollReveal from './ScrollReveal';

interface ProductSpotlightProps {
    product: Product;
    index?: number;
    reverse?: boolean;
}

const ProductSpotlight: React.FC<ProductSpotlightProps> = ({
    product,
    index = 0,
    reverse = false,
}) => {
    // Helper to get display price
    const getDisplayPrice = () => {
        if (typeof product.price === 'number') {
            return product.price.toLocaleString();
        }
        const priceObj = product.price as ProductPrice;
        return priceObj.twoRow?.toLocaleString() || priceObj.threeRow?.toLocaleString() || priceObj.default?.toLocaleString() || '0';
    };

    const isMultiPrice = typeof product.price !== 'number';

    return (
        <section className="py-20 md:py-32 relative overflow-hidden">
            {/* Background Elements */}
            <div
                className={`absolute ${reverse ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none`}
            />

            <div className="container mx-auto px-4">
                <div
                    className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? 'lg:flex-row-reverse' : ''
                        }`}
                >
                    {/* Product Image */}
                    <ScrollReveal
                        animation={reverse ? 'slideInRight' : 'slideInLeft'}
                        delay={index * 100}
                        className={reverse ? 'lg:order-2' : ''}
                    >
                        <Link to={`/product/${product.id}`} className="block group">
                            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/95 p-8 md:p-12 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-brand-orange/30 hover:shadow-brand-orange/10">
                                {/* NEW Badge */}
                                <span className="badge-new z-10">NEW</span>

                                {/* Glow effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-auto max-h-[400px] object-contain mx-auto transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>
                        </Link>
                    </ScrollReveal>

                    {/* Product Info */}
                    <ScrollReveal
                        animation={reverse ? 'slideInLeft' : 'slideInRight'}
                        delay={index * 100 + 150}
                        className={reverse ? 'lg:order-1' : ''}
                    >
                        <div className="space-y-6">
                            {/* Category Tag */}
                            <span className="inline-block px-3 py-1 text-xs font-medium text-brand-orange bg-brand-orange/10 rounded-full uppercase tracking-wider">
                                New Arrival
                            </span>

                            {/* Product Name */}
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                                {product.name}
                            </h2>

                            {/* Description */}
                            {product.description && (
                                <p className="text-lg text-gray-600 leading-relaxed line-clamp-3">
                                    {Array.isArray(product.description)
                                        ? product.description[0]
                                        : product.description.split('\n')[0]}
                                </p>
                            )}

                            {/* Price Display */}
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm text-gray-500">
                                    {isMultiPrice ? 'Starting at' : 'Price'}
                                </span>
                                <span className="text-3xl font-bold gradient-text">
                                    ₹{getDisplayPrice()}
                                </span>
                            </div>

                            {/* Features List */}
                            <div className="flex flex-wrap gap-3">
                                {['Premium Quality', 'Easy Install', 'Warranty'].map((feature, i) => (
                                    <span
                                        key={i}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            {/* CTA */}
                            <Link
                                to={`/product/${product.id}`}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 hover-glow transition-all duration-300 group"
                            >
                                View Product
                                <svg
                                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
};

export default ProductSpotlight;

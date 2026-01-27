import React from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductPrice } from '@/types/catalog';
import ScrollReveal from './ScrollReveal';

interface NewArrivalsShowcaseProps {
    products: Product[];
    title?: string;
    subtitle?: string;
}

const NewArrivalsShowcase: React.FC<NewArrivalsShowcaseProps> = ({
    products,
    title = 'New Arrivals',
    subtitle = 'Discover our latest premium automotive accessories',
}) => {
    // Helper to get display price
    const getDisplayPrice = (product: Product) => {
        if (typeof product.price === 'number') {
            return product.price.toLocaleString();
        }
        const priceObj = product.price as ProductPrice;
        return priceObj.twoRow?.toLocaleString() || priceObj.threeRow?.toLocaleString() || priceObj.default?.toLocaleString() || '0';
    };

    const isMultiPrice = (product: Product) => typeof product.price !== 'number';

    return (
        <section className="py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <ScrollReveal animation="fadeInUp" className="text-center mb-10">
                    <span className="inline-block px-4 py-2 mb-4 text-sm font-medium text-brand-orange bg-brand-orange/10 rounded-full uppercase tracking-wider">
                        Just Launched
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                        {title}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </ScrollReveal>

                {/* Products Grid - Light Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {products.slice(0, 8).map((product, index) => (
                        <ScrollReveal
                            key={product.id}
                            animation="fadeInUp"
                            delay={index * 100}
                        >
                            <Link
                                to={`/product/${product.id}`}
                                className="group block h-full"
                            >
                                <div className="glass-card-premium h-full flex flex-col rounded-3xl overflow-visible relative">
                                    {/* Swinging NEW Tag */}
                                    <div className="hanging-tag">
                                        <div className="hanging-tag-body"></div>
                                    </div>

                                    {/* Product Image - White background friendly */}
                                    <div className="aspect-square p-6 flex items-center justify-center overflow-hidden bg-white rounded-t-3xl">
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-6 pt-4 flex-grow flex flex-col">
                                        {/* Rating */}
                                        <div className="flex items-center gap-1 mb-2">
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
                                            <span className="text-xs text-gray-400 ml-1">
                                                {product.rating?.toFixed(1) || 'New'}
                                            </span>
                                        </div>

                                        {/* Product Name */}
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-brand-orange transition-colors">
                                            {product.name}
                                        </h3>

                                        {/* Description Bullet Points */}
                                        {product.description && (
                                            <ul className="text-xs text-gray-500 mb-2 space-y-0.5 list-disc list-inside">
                                                {(Array.isArray(product.description)
                                                    ? product.description
                                                    : product.description.split('\n').filter(line => line.trim())
                                                ).slice(0, 2).map((item: string, idx: number) => (
                                                    <li key={idx} className="line-clamp-1">{item}</li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Price */}
                                        <div className="flex items-baseline gap-2 mt-auto">
                                            <span className="text-xl font-bold text-brand-orange">
                                                ₹{getDisplayPrice(product)}
                                            </span>
                                            {isMultiPrice(product) && (
                                                <span className="text-xs text-gray-500">onwards</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>

                {/* View All Link */}
                <ScrollReveal animation="fadeInUp" delay={400} className="text-center mt-12">
                    <Link
                        to="/category/new-arrivals"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-brand-orange transition-all duration-300 hover:shadow-lg"
                    >
                        View All Products
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </ScrollReveal>
            </div>
        </section>
    );
};

export default NewArrivalsShowcase;

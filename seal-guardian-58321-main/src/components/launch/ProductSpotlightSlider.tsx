import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductPrice } from '@/types/catalog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

interface ProductSpotlightSliderProps {
    products: Product[];
}

const ProductSpotlightSlider: React.FC<ProductSpotlightSliderProps> = ({
    products,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-advance every 5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [products.length]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }, [products.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
    }, [products.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    // Helper to get display price
    const getDisplayPrice = (product: Product) => {
        if (typeof product.price === 'number') {
            return product.price.toLocaleString();
        }
        const priceObj = product.price as ProductPrice;
        return priceObj.twoRow?.toLocaleString() || priceObj.threeRow?.toLocaleString() || priceObj.default?.toLocaleString() || '0';
    };

    const isMultiPrice = (product: Product) => typeof product.price !== 'number';

    const currentProduct = products[currentIndex];

    if (!currentProduct) return null;

    return (
        <section id="featured-section" className="py-12 md:py-16 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <ScrollReveal animation="fadeInUp" className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                        Featured Products
                    </h2>
                </ScrollReveal>

                {/* Slider Container */}
                <div className="relative">
                    {/* Navigation Arrows */}
                    <button
                        onClick={goToPrevious}
                        className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-brand-orange hover:shadow-xl transition-all duration-300"
                        aria-label="Previous product"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-brand-orange hover:shadow-xl transition-all duration-300"
                        aria-label="Next product"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Slide Content */}
                    <div className="px-4 sm:px-8 md:px-12 lg:px-16">
                        <div
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center transition-all duration-500"
                            key={currentProduct.id}
                        >
                            {/* Product Image */}
                            <Link to={`/product/${currentProduct.id}`} className="block group">
                                <div className="glass-card-dark relative rounded-2xl sm:rounded-3xl overflow-hidden p-4 sm:p-8 md:p-12">
                                    {/* Glow effect on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <img
                                        src={currentProduct.images[0]}
                                        alt={currentProduct.name}
                                        className="w-full h-auto max-h-[200px] sm:max-h-[280px] md:max-h-[350px] object-contain mx-auto transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                            </Link>

                            {/* Product Info */}
                            <div className="space-y-4 sm:space-y-6 animate-fade-in-up text-center lg:text-left">
                                {/* Category Tag */}
                                <span className="inline-block px-3 py-1 text-xs font-medium text-brand-orange bg-brand-orange/10 rounded-full uppercase tracking-wider">
                                    🔥 Trending
                                </span>

                                {/* Product Name */}
                                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                                    {currentProduct.name}
                                </h3>

                                {currentProduct.description && (
                                    <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                        {Array.isArray(currentProduct.description)
                                            ? currentProduct.description[0]
                                            : currentProduct.description.split('\n')[0]}
                                    </p>
                                )}

                                {/* Price Display */}
                                <div className="flex items-baseline gap-2 justify-center lg:justify-start">
                                    <span className="text-sm text-gray-500">
                                        {isMultiPrice(currentProduct) ? 'Starting at' : 'Price'}
                                    </span>
                                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-orange">
                                        ₹{getDisplayPrice(currentProduct)}
                                    </span>
                                </div>

                                {/* Features List - Hidden on mobile, shown on sm+ */}
                                <div className="hidden sm:flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
                                    {['Premium Quality', 'Easy Install', 'Warranty'].map((feature, i) => (
                                        <span
                                            key={i}
                                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-full"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>

                                {/* CTA */}
                                <Link
                                    to={`/product/${currentProduct.id}`}
                                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gray-900 text-white text-sm sm:text-base font-semibold rounded-full hover:bg-brand-orange transition-all duration-300 group"
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
                        </div>
                    </div>

                    {/* Dots Navigation - Hidden on mobile */}
                    <div className="hidden sm:flex justify-center items-center gap-1.5 mt-6">
                        {products.map((_, index) => {
                            // Calculate distance from current for scaling effect
                            const distance = Math.abs(index - currentIndex);
                            // Only show 5 dots on mobile (2 on each side of current)
                            const isVisible = distance <= 2;
                            // Scale based on distance
                            const scale = distance === 0 ? 1 : distance === 1 ? 0.75 : 0.5;
                            const opacity = distance === 0 ? 1 : distance === 1 ? 0.7 : 0.4;

                            return (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`rounded-full transition-all duration-300 ${index === currentIndex
                                        ? 'bg-brand-orange'
                                        : 'bg-gray-400'
                                        } ${!isVisible ? 'hidden sm:block' : ''}`}
                                    style={{
                                        width: index === currentIndex ? '16px' : '6px',
                                        height: '6px',
                                        transform: `scale(${scale})`,
                                        opacity: opacity,
                                    }}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductSpotlightSlider;

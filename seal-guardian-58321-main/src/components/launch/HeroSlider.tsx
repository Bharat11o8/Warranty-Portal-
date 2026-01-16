import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductPrice } from '@/types/catalog';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface HeroSliderProps {
    products: Product[];
}

const HeroSlider: React.FC<HeroSliderProps> = ({ products }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Auto-advance every 4 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            goToNext();
        }, 4000);
        return () => clearInterval(timer);
    }, [currentIndex]);

    const goToPrevious = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
        setTimeout(() => setIsAnimating(false), 500);
    }, [products.length, isAnimating]);

    const goToNext = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % products.length);
        setTimeout(() => setIsAnimating(false), 500);
    }, [products.length, isAnimating]);

    // Helper to get display price
    const getDisplayPrice = (product: Product) => {
        if (typeof product.price === 'number') {
            return product.price.toLocaleString();
        }
        const priceObj = product.price as ProductPrice;
        return priceObj.twoRow?.toLocaleString() || priceObj.threeRow?.toLocaleString() || priceObj.default?.toLocaleString() || '0';
    };

    const currentProduct = products[currentIndex];

    if (!currentProduct) return null;

    return (
        <section className="relative min-h-[85vh] md:min-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-brand-orange/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-brand-orange/3 to-brand-yellow/3 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 h-full relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[85vh] md:min-h-[90vh] py-8">

                    {/* Left Content */}
                    <div className="order-2 lg:order-1 text-center lg:text-left space-y-6 md:space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-orange/10 to-brand-yellow/10 rounded-full border border-brand-orange/20">
                            <Sparkles className="w-4 h-4 text-brand-orange" />
                            <span className="text-sm font-semibold text-brand-orange uppercase tracking-wider">
                                New Collection
                            </span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1]">
                            Premium
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-yellow">
                                Automotive
                            </span>
                            <br />
                            Accessories
                        </h1>

                        {/* Subheading */}
                        <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                            Elevate your driving experience with our carefully crafted collection of high-quality accessories.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex justify-center lg:justify-start pt-4">
                            <button
                                onClick={() => document.getElementById('category-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="group relative px-8 py-4 bg-gray-900 text-white font-bold rounded-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-brand-orange/25"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Explore Products
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-orange to-brand-yellow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span>30+ Years Experience</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span>ISO Certified</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span>Pan India Delivery</span>
                            </div>
                        </div>
                    </div>

                    {/* Right - Product Showcase */}
                    <div className="order-1 lg:order-2 relative">
                        {/* Navigation Arrows */}
                        <button
                            onClick={goToPrevious}
                            className="absolute left-0 lg:-left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-brand-orange hover:bg-white hover:scale-110 transition-all duration-300"
                            aria-label="Previous"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-0 lg:-right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-brand-orange hover:bg-white hover:scale-110 transition-all duration-300"
                            aria-label="Next"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Product Card */}
                        <div
                            className={`relative mx-8 lg:mx-0 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                            key={currentProduct.id}
                        >
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 to-brand-yellow/10 rounded-[2rem] blur-2xl scale-95" />

                            {/* Card */}
                            <div className="relative glass-card-dark rounded-[2rem] p-6 md:p-8">
                                {/* Hot Badge */}
                                <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-brand-orange to-brand-yellow text-black font-bold text-xs rounded-full uppercase tracking-wider shadow-lg">
                                        🔥 Hot
                                    </span>
                                </div>

                                {/* Product Image */}
                                <div className="relative aspect-square mb-6 flex items-center justify-center">
                                    <img
                                        src={currentProduct.images[0]}
                                        alt={currentProduct.name}
                                        className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                                    />
                                </div>

                                {/* Product Info */}
                                <div className="text-center space-y-3">
                                    <h3 className="text-xl md:text-2xl font-bold text-white line-clamp-1">
                                        {currentProduct.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-2xl md:text-3xl font-black text-brand-orange">
                                            ₹{getDisplayPrice(currentProduct)}
                                        </span>
                                    </div>
                                    <Link
                                        to={`/product/${currentProduct.id}`}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-brand-orange hover:text-white transition-all duration-300 text-sm"
                                    >
                                        View Details
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Slide Indicators */}
                        <div className="flex justify-center gap-2 mt-6">
                            {products.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                                        ? 'w-8 bg-brand-orange'
                                        : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                                        }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSlider;

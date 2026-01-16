import React, { useEffect, useState } from 'react';
import { fetchProducts, fetchCategories, Product, Category } from '@/lib/catalogService';
import CategoryGrid from '@/components/CategoryGrid';
import {
    ProductSpotlightSlider,
    NewArrivalsShowcase,
    ScrollReveal
} from '@/components/launch';
import { Link } from 'react-router-dom';
import { Shield, Zap, Award, Truck, Loader2 } from 'lucide-react';
import CatalogHeader from '@/components/eshop/CatalogHeader';
import TabbedProductShowcase from '@/components/eshop/TabbedProductShowcase';

const VendorCatalog = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const prods = await fetchProducts();
                setProducts(prods);
            } catch (error) {
                console.error("Error loading vendor catalog data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // New arrivals: Latest 8 products
    const newArrivals = [...products].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8);

    // Spotlight: Products with many images/reviews or first 10
    const spotlightProducts = products.slice(0, 10);

    const fourWheelerTabs = [
        { id: '4w-seat', label: 'Car Seat Covers', categoryId: '4-wheeler-seat-cover' },
        { id: '4w-mat', label: 'Car Mats', categoryId: 'mat' },
        { id: '4w-acc', label: 'Car Accessories', categoryId: '4-wheeler-accessories' }
    ];

    const twoWheelerTabs = [
        { id: '2w-seat', label: '2 Wheeler Seat Covers', categoryId: '2-wheeler-seat-cover' },
        { id: '2w-mat', label: '2 Wheeler Mats', categoryId: 'foot-mat' },
        { id: '2w-acc', label: '2 Wheeler Accessories', categoryId: '2-wheeler-accessories' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-brand-orange" />
            </div>
        );
    }

    return (
        <div className="bg-white">
            {/* Category Header with Search and Dropdowns */}
            <CatalogHeader />

            {/* Hero Section - Clean Light Theme */}
            <section className="pt-12 md:pt-16 pb-4 bg-gradient-to-b from-gray-50 to-white">
                <div className="container mx-auto px-4">
                    <ScrollReveal animation="fadeInUp" className="text-center mb-12">
                        <span className="inline-block px-4 py-2 mb-6 text-sm font-semibold text-brand-orange bg-brand-orange/10 rounded-full uppercase tracking-wider">
                            ✨ New Collection
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Premium Automotive<br />
                            <span className="text-brand-orange">Accessories</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                            Elevate your driving experience with our carefully crafted collection of high-quality automotive accessories.
                        </p>
                        <div className="flex justify-center">
                            <button
                                onClick={() => document.getElementById('featured-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-brand-orange transition-all duration-300 hover:shadow-lg"
                            >
                                Explore Products
                            </button>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Featured Products Slider */}
            <ProductSpotlightSlider products={spotlightProducts} />

            {/* 4 Wheeler Products Showcase */}
            <TabbedProductShowcase
                sectionId="category-section"
                title="4 Wheeler Products"
                tabs={fourWheelerTabs}
            />

            {/* 2 Wheeler Products Showcase with subtle alternating background */}
            <div className="bg-gray-50/50 border-y border-gray-100">
                <TabbedProductShowcase
                    title="2 Wheeler Products"
                    tabs={twoWheelerTabs}
                />
            </div>

            {/* New Arrivals Grid */}
            <NewArrivalsShowcase
                products={newArrivals}
                title="New Arrivals"
                subtitle="Experience the latest in automotive innovation"
            />

            {/* Why Choose Us - Just before Footer */}
            <section className="py-12 md:py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <ScrollReveal animation="fadeInUp" className="text-center mb-10">
                        <span className="inline-block px-4 py-2 mb-4 text-sm font-medium text-brand-orange bg-brand-orange/10 rounded-full uppercase tracking-wider">
                            Why Autoform
                        </span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            30+ Years of Excellence
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            ISO TS/16949 certified manufacturing with world-class quality standards
                        </p>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: <Shield className="w-8 h-8" />, title: 'Premium Quality', desc: 'Crafted with finest materials' },
                            { icon: <Zap className="w-8 h-8" />, title: 'Easy Installation', desc: 'Hassle-free setup guides' },
                            { icon: <Award className="w-8 h-8" />, title: 'ISO Certified', desc: 'World-class standards' },
                            { icon: <Truck className="w-8 h-8" />, title: 'Pan India Delivery', desc: 'Fast & reliable shipping' },
                        ].map((feature, index) => (
                            <ScrollReveal key={index} animation="fadeInUp" delay={index * 100}>
                                <div className="glass-card-premium p-8 rounded-2xl text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>

                    {/* Trust Stats */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { number: '30+', label: 'Years Experience' },
                            { number: '2.2L', label: 'Sq. Ft. Facility' },
                            { number: '500+', label: 'Products' },
                            { number: '1M+', label: 'Happy Customers' },
                        ].map((stat, index) => (
                            <ScrollReveal key={index} animation="scaleIn" delay={index * 100}>
                                <div className="text-center">
                                    <div className="text-3xl md:text-4xl font-bold text-brand-orange mb-1">
                                        {stat.number}
                                    </div>
                                    <div className="text-gray-600 text-sm">
                                        {stat.label}
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default VendorCatalog;

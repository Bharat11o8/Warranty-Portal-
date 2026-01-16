import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/catalogService';
import { getProductsByDeepCategory } from '@/lib/catalogService';
import ProductCard from '@/components/ProductCard';
import { ScrollReveal } from '@/components/launch';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';

interface Tab {
    id: string;
    label: string;
    categoryId: string;
}

interface TabbedProductShowcaseProps {
    title: string;
    tabs: Tab[];
    sectionId?: string;
}

const TabbedProductShowcase: React.FC<TabbedProductShowcaseProps> = ({ title, tabs, sectionId }) => {
    const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
    const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadProducts = async () => {
            const activeTab = tabs.find(t => t.id === activeTabId);
            if (activeTab) {
                setLoading(true);
                try {
                    const products = await getProductsByDeepCategory(activeTab.categoryId);
                    setDisplayProducts(products.slice(0, 4)); // Show only 4 cards
                } catch (error) {
                    console.error("Error loading tabbed products:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadProducts();
    }, [activeTabId, tabs]);

    return (
        <section id={sectionId} className="py-16 bg-white overflow-hidden relative">
            {/* Subtle decorative background element */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-gray-100 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header with Title and Tabs */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10 mb-10">
                    <div className="space-y-1">
                        <div className="w-6 h-1 bg-brand-orange rounded-full mb-2" />
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                            {title}
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
                        {/* Tab Pills */}
                        <div className="flex flex-wrap items-center bg-gray-100/80 backdrop-blur-sm p-0.5 rounded-lg border border-gray-200">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTabId(tab.id)}
                                    className={`px-3 py-1 text-[10px] md:text-xs font-bold uppercase transition-all duration-300 rounded-md whitespace-nowrap ${activeTabId === tab.id
                                        ? 'bg-white text-brand-orange shadow-sm scale-[1.02]'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* View All CTA */}
                        <Link
                            to={`/category/${tabs.find(t => t.id === activeTabId)?.categoryId}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[10px] md:text-xs font-bold uppercase rounded-lg hover:bg-brand-orange transition-all duration-300 shadow-sm hover:shadow-lg group whitespace-nowrap"
                        >
                            View All
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 min-h-[300px] relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-brand-orange" />
                        </div>
                    ) : (
                        <>
                            {displayProducts.map((product, idx) => (
                                <ScrollReveal key={product.id} animation="fadeInUp" delay={idx * 100}>
                                    <div className="group transition-transform duration-500 hover:-translate-y-2">
                                        <ProductCard product={product} />
                                    </div>
                                </ScrollReveal>
                            ))}
                            {displayProducts.length === 0 && (
                                <div className="col-span-full py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center text-gray-400 italic">
                                    New products coming soon for this category
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TabbedProductShowcase;

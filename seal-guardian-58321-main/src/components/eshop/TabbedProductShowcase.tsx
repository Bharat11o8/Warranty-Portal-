import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/catalogService';
import { getProductsByDeepCategory } from '@/lib/catalogService';
import ProductCard from '@/components/ProductCard';
import { ScrollReveal } from '@/components/launch';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi
} from "@/components/ui/carousel";

// ... existing interfaces ...

const TabbedProductShowcase: React.FC<TabbedProductShowcaseProps> = ({ title, tabs, sectionId }) => {
    const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
    const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [api, setApi] = useState<CarouselApi>();

    // Auto-advance logic
    useEffect(() => {
        if (!api) return;
        const interval = setInterval(() => {
            api.scrollNext();
        }, 5000); // 5s for tabs to allow more reading time
        return () => clearInterval(interval);
    }, [api]);

    useEffect(() => {
        const loadProducts = async () => {
            const activeTab = tabs.find(t => t.id === activeTabId);
            if (activeTab) {
                setLoading(true);
                try {
                    const products = await getProductsByDeepCategory(activeTab.categoryId);
                    setDisplayProducts(products.slice(0, 8)); // Show up to 8 cards
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
        <section id={sectionId} className="pt-4 pb-8 md:py-16 bg-white overflow-hidden relative">
            {/* Subtle decorative background element */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-gray-100 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header with Title and Tabs/Dropdown */}
                <div className="space-y-6 md:space-y-0 md:flex md:items-end md:justify-between mb-8 md:mb-12">

                    {/* Title Row (Mobile: Badge + Title + View All) */}
                    <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center justify-between">
                            <span className="md:hidden inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-brand-orange bg-brand-orange/5 border border-brand-orange/10 rounded-full mb-1">
                                Premium Gear
                            </span>
                            {/* Mobile View All */}
                            <Link
                                to={`/category/${tabs.find(t => t.id === activeTabId)?.categoryId}`}
                                className="md:hidden inline-flex items-center gap-1 text-[10px] font-black uppercase text-brand-orange/80 hover:text-brand-orange transition-colors"
                            >
                                View All
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-brand-orange rounded-full" />
                            <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                                {title.split(' ')[0]} <span className="text-brand-orange/90 font-medium lowercase italic">{title.split(' ').slice(1).join(' ')}</span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 lg:gap-6">

                        {/* Mobile MINIMALIST TABS (Apple-style Refinement) */}
                        <div className="md:hidden -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center border-b border-gray-100/50">
                            <div className="flex items-center gap-8 min-w-max py-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTabId(tab.id)}
                                        className={cn(
                                            "relative py-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                                            activeTabId === tab.id
                                                ? "text-brand-orange"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        {tab.label}
                                        {activeTabId === tab.id && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-orange rounded-full animate-in fade-in slide-in-from-left-1 duration-300" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Tab Pills (UNTOUCHED) */}
                        <div className="hidden md:flex flex-wrap items-center bg-gray-100/80 backdrop-blur-sm p-0.5 rounded-lg border border-gray-200">
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

                        {/* Desktop View All CTA (UNTOUCHED) */}
                        <Link
                            to={`/category/${tabs.find(t => t.id === activeTabId)?.categoryId}`}
                            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[10px] md:text-xs font-bold uppercase rounded-lg hover:bg-brand-orange transition-all duration-300 shadow-sm hover:shadow-lg group whitespace-nowrap"
                        >
                            View All
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Product Carousel / Mobile View */}
                <div className="relative -mx-4 md:mx-0">
                    {loading ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <Loader2 className="w-10 h-10 animate-spin text-brand-orange" />
                        </div>
                    ) : (
                        <Carousel
                            setApi={setApi}
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4 md:-ml-8">
                                {displayProducts.map((product, idx) => (
                                    <CarouselItem
                                        key={product.id}
                                        className="pl-2 md:pl-8 basis-full md:basis-1/2 lg:basis-1/3"
                                    >
                                        <ScrollReveal animation="fadeInUp" delay={idx * 100}>
                                            <div className="group transition-transform duration-500 hover:-translate-y-2 h-full">
                                                <ProductCard product={product} />
                                            </div>
                                        </ScrollReveal>
                                    </CarouselItem>
                                ))}
                                {displayProducts.length === 0 && (
                                    <CarouselItem className="basis-full">
                                        <div className="w-full py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] text-center text-gray-400 italic">
                                            New products coming soon for this category
                                        </div>
                                    </CarouselItem>
                                )}
                            </CarouselContent>
                        </Carousel>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TabbedProductShowcase;

import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types/catalog';
import { ChevronRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import ProductCard from '../ProductCard';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi
} from "@/components/ui/carousel";

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
    const [api, setApi] = React.useState<CarouselApi>();

    // Auto-advance logic
    React.useEffect(() => {
        if (!api) return;
        const interval = setInterval(() => {
            api.scrollNext();
        }, 4000);
        return () => clearInterval(interval);
    }, [api]);

    return (
        <section className="py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <ScrollReveal animation="fadeInUp" className="text-center mb-10 flex flex-col items-center">
                    <div className="flex items-center justify-between w-full md:justify-center mb-6">
                        <div className="flex flex-col items-start md:items-center gap-1.5 flex-1">
                            <span className="inline-block px-3 py-1 mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange bg-brand-orange/5 border border-brand-orange/10 rounded-full">
                                ✨ Just Launched
                            </span>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-brand-orange rounded-full" />
                                <h2 className="text-3xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                                    {title.split(' ')[0]} <span className="text-brand-orange/90 font-medium lowercase italic">{title.split(' ').slice(1).join(' ')}</span>
                                </h2>
                            </div>
                        </div>

                        {/* Mobile View All */}
                        <Link
                            to="/category/new-arrivals"
                            className="md:hidden inline-flex items-center gap-1 text-[10px] font-black uppercase text-brand-orange/80 hover:text-brand-orange transition-colors"
                        >
                            View All
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <p className="hidden md:block text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                </ScrollReveal>

                {/* Products Carousel */}
                <div className="relative -mx-4 md:mx-0">
                    <Carousel
                        setApi={setApi}
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4 md:-ml-6">
                            {products.slice(0, 8).map((product, index) => (
                                <CarouselItem
                                    key={product.id}
                                    className="pl-2 md:pl-6 basis-full md:basis-1/2 lg:basis-1/3"
                                >
                                    <ScrollReveal
                                        animation="fadeInUp"
                                        delay={index * 100}
                                        className="h-full"
                                    >
                                        <ProductCard product={product} />
                                    </ScrollReveal>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
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

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductLaunchHeroProps {
    productImage: string;
    headline: string;
    subheadline: string;
    tagline?: string;
    ctaText?: string;
    ctaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    isNew?: boolean;
}

const ProductLaunchHero: React.FC<ProductLaunchHeroProps> = ({
    productImage,
    headline,
    subheadline,
    tagline,
    ctaText = 'Explore',
    ctaLink = '#',
    secondaryCtaText,
    secondaryCtaLink,
    isNew = true,
}) => {
    const scrollToContent = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth',
        });
    };

    return (
        <section className="hero-full bg-dark-radial relative">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

            {/* Ambient glow behind product */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 text-center relative z-10">
                {/* NEW Badge */}
                {isNew && (
                    <div className="animate-fade-in-down mb-6">
                        <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-brand-orange to-brand-yellow text-black uppercase tracking-wider shadow-lg">
                            ✨ New Arrival
                        </span>
                    </div>
                )}

                {/* Tagline */}
                {tagline && (
                    <p className="text-brand-orange font-medium text-sm md:text-base tracking-widest uppercase mb-4 animate-fade-in-up">
                        {tagline}
                    </p>
                )}

                {/* Headline */}
                <h1 className="hero-headline gradient-text-white mb-4 animate-fade-in-up delay-100">
                    {headline}
                </h1>

                {/* Subheadline */}
                <p className="hero-subheadline text-white/70 max-w-2xl mx-auto mb-8 animate-fade-in-up delay-200">
                    {subheadline}
                </p>

                {/* Product Image with floating effect */}
                <div className="my-8 md:my-12 animate-scale-in delay-300">
                    <img
                        src={productImage}
                        alt={headline}
                        className="max-w-full md:max-w-2xl lg:max-w-3xl mx-auto drop-shadow-2xl animate-float-subtle transition-transform duration-500 hover:scale-105"
                        style={{ filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.5))' }}
                    />
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up delay-400">
                    <Link to={ctaLink}>
                        <Button
                            size="lg"
                            className="bg-brand-orange hover:bg-brand-orange/90 text-white px-8 py-6 text-lg rounded-full hover-glow transition-all duration-300"
                        >
                            {ctaText}
                        </Button>
                    </Link>
                    {secondaryCtaText && secondaryCtaLink && (
                        <Link to={secondaryCtaLink}>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full transition-all duration-300"
                            >
                                {secondaryCtaText}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Scroll Indicator */}
            <button
                onClick={scrollToContent}
                className="scroll-indicator text-white/50 hover:text-white transition-colors cursor-pointer"
                aria-label="Scroll to content"
            >
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs uppercase tracking-widest">Scroll</span>
                    <ChevronDown className="w-6 h-6 animate-bounce-arrow" />
                </div>
            </button>
        </section>
    );
};

export default ProductLaunchHero;

import React from 'react';
import ScrollReveal from './ScrollReveal';

interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface FeatureShowcaseProps {
    title: string;
    subtitle?: string;
    features: Feature[];
    productImage?: string;
    productName?: string;
    reverse?: boolean;
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
    title,
    subtitle,
    features,
    productImage,
    productName,
    reverse = false,
}) => {
    return (
        <section className="py-20 md:py-32 bg-dark-gradient text-white overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <ScrollReveal animation="fadeInUp" className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gradient-text-white">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-lg text-white/60 max-w-2xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </ScrollReveal>

                <div
                    className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? 'lg:flex-row-reverse' : ''
                        }`}
                >
                    {/* Features Grid */}
                    <ScrollReveal
                        animation={reverse ? 'slideInRight' : 'slideInLeft'}
                        className={reverse ? 'lg:order-2' : ''}
                    >
                        <div className="feature-grid">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="feature-item group"
                                >
                                    {/* Icon */}
                                    <div className="w-12 h-12 mb-4 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all duration-300">
                                        {feature.icon}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-semibold mb-2 text-white">
                                        {feature.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-white/60 text-sm leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </ScrollReveal>

                    {/* Product Image */}
                    {productImage && (
                        <ScrollReveal
                            animation={reverse ? 'slideInLeft' : 'slideInRight'}
                            className={reverse ? 'lg:order-1' : ''}
                        >
                            <div className="relative">
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-brand-orange/20 rounded-full blur-[80px]" />

                                <div className="relative perspective-2000">
                                    <img
                                        src={productImage}
                                        alt={productName || 'Product'}
                                        className="w-full max-w-lg mx-auto animate-float-subtle drop-shadow-2xl"
                                        style={{ filter: 'drop-shadow(0 30px 60px rgba(255, 138, 0, 0.3))' }}
                                    />
                                </div>
                            </div>
                        </ScrollReveal>
                    )}
                </div>
            </div>
        </section>
    );
};

export default FeatureShowcase;

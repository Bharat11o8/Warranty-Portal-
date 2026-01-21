import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
    id: string;
    name: string;
    price: { regular: number; sale?: number; twoRow?: number; threeRow?: number };
    description: { short: string; long: string };
    images: string[];
    category_id: string;
    in_stock: boolean;
    rating?: number;
}

interface ProductCardProps {
    product: Product;
    categoryName?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, categoryName }) => {
    // List of product IDs that need "Price Onward" (mapped from E-Shop logic)
    const onwardPriceProductIds = ['led-head-lamp', 'led-fog-lamp', 'car-charger'];
    const showPriceOnward = onwardPriceProductIds.some(id => product.id?.includes(id));

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        // If it's a relative path, we might need a base URL.
        // For now, let's assume images are in the same origin if relative.
        return url;
    };

    return (
        <Card className="glass-card-premium rounded-2xl overflow-hidden h-full flex flex-col border-none group">
            {/* Product Image */}
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                {product.images?.[0] ? (
                    <img
                        src={getImageUrl(product.images[0])}
                        alt={product.name}
                        className="object-contain w-full h-full p-6 transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                        No Image
                    </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    {!product.in_stock && (
                        <Badge variant="destructive" className="font-bold">Out of Stock</Badge>
                    )}
                </div>

                {/* Swinging NEW Tag */}
                {product.id.includes('new') && (
                    <div className="absolute -top-1 right-4 z-20">
                        <div className="animate-swing origin-top">
                            <div className="bg-red-600 text-white text-[10px] font-black tracking-widest px-2 py-1 rounded-b-md shadow-lg border-x border-b border-red-800">
                                NEW
                            </div>
                        </div>
                    </div>
                )}

                {categoryName && (
                    <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm text-[10px] uppercase tracking-wider font-semibold">
                            {categoryName}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="p-5 flex-grow flex flex-col">
                {/* Rating */}
                <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < Math.round(product.rating || 4.5) ? 'fill-brand-yellow text-brand-yellow' : 'text-gray-200'}`}
                        />
                    ))}
                    <span className="ml-1.5 text-xs text-gray-500 font-medium">
                        {Number(product.rating || 4.5).toFixed(1)}
                    </span>
                </div>

                {/* Product Name */}
                <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-brand-orange transition-colors duration-300">
                    {product.name}
                </CardTitle>

                {/* Price Display */}
                <div className="mt-auto space-y-2">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-brand-orange">
                            ₹{product.price?.regular?.toLocaleString()}
                        </span>
                        {showPriceOnward && (
                            <span className="text-xs text-gray-400 font-normal">onwards</span>
                        )}
                        {product.price?.sale && (
                            <span className="text-sm text-gray-400 line-through ml-2">
                                ₹{product.price.sale.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Multi-row prices if available */}
                    {(product.price?.twoRow || product.price?.threeRow) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {product.price.twoRow && (
                                <Badge variant="outline" className="text-[9px] py-0 border-gray-200">2 Row: ₹{product.price.twoRow.toLocaleString()}</Badge>
                            )}
                            {product.price.threeRow && (
                                <Badge variant="outline" className="text-[9px] py-0 border-gray-200">3 Row: ₹{product.price.threeRow.toLocaleString()}</Badge>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="outline" size="sm" className="w-full border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white transition-all rounded-xl">
                        <Info className="mr-2 h-4 w-4" /> Details
                    </Button>
                </div>
            </div>
        </Card>
    );
};

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Car, Smartphone, Shield, Settings, Headphones, Sparkles, Package } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    description?: string;
}

interface CategoryCardProps {
    category: Category;
    isSelected: boolean;
    onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onClick }) => {
    const getCategoryIcon = (categoryId: string) => {
        const id = categoryId.toLowerCase();
        if (id.includes('seat')) return <Car className="h-6 w-6" />;
        if (id.includes('access')) return <Smartphone className="h-6 w-6" />;
        if (id.includes('mat')) return <Shield className="h-6 w-6" />;
        if (id.includes('utility')) return <Settings className="h-6 w-6" />;
        if (id.includes('audio') || id.includes('security')) return <Headphones className="h-6 w-6" />;
        if (id.includes('care') || id.includes('fragrance')) return <Sparkles className="h-6 w-6" />;
        return <Package className="h-6 w-6" />;
    };

    return (
        <Card
            onClick={onClick}
            className={`cursor-pointer transition-all duration-300 border h-24 min-w-[120px] flex-shrink-0 group overflow-hidden relative
                ${isSelected
                    ? 'border-brand-orange bg-brand-orange/5 ring-1 ring-brand-orange/20 shadow-md'
                    : 'border-gray-100 bg-white hover:border-brand-orange/30 hover:shadow-sm'}`}
        >
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center relative z-10">
                <div className={`mb-2 transition-colors duration-300 
                    ${isSelected ? 'text-brand-orange' : 'text-gray-400 group-hover:text-brand-orange/70'}`}>
                    {getCategoryIcon(category.id)}
                </div>
                <h3 className={`font-bold text-xs transition-colors duration-300 select-none
                    ${isSelected ? 'text-brand-orange' : 'text-gray-600 group-hover:text-gray-900'}`}>
                    {category.name}
                </h3>
            </CardContent>

            {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-orange" />
            )}
        </Card>
    );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '@/types/catalog';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface CategoryCardProps {
    category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
    return (
        <Link to={`/category/${category.id}`} className="group block">
            <div className="glass-card-premium rounded-2xl overflow-hidden">
                <AspectRatio ratio={16 / 9} className="bg-gradient-to-br from-gray-50 to-gray-100">
                    <img
                        src={category.image || "/placeholder.svg"}
                        alt={category.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                </AspectRatio>
                <div className="p-5">
                    <h3 className="font-semibold text-gray-900 text-lg group-hover:text-brand-orange transition-colors">
                        {category.name}
                    </h3>
                    {category.description && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{category.description}</p>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default CategoryCard;

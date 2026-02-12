import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '@/types/catalog';
import { Card, CardContent } from '@/components/ui/card';
import {
  Car,
  Headphones,
  Shield,
  Sparkles,
  Smartphone,
  Settings
} from 'lucide-react';

interface CategoryGridProps {
  categories: Category[];
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories }) => {
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'seat-cover':
        return <Car className="h-8 w-8" />;
      case 'accessories':
        return <Smartphone className="h-8 w-8" />;
      case 'mat':
        return <Shield className="h-8 w-8" />;
      case 'life-utility':
        return <Settings className="h-8 w-8" />;
      case 'audio-security':
        return <Headphones className="h-8 w-8" />;
      case 'care-fragrance':
        return <Sparkles className="h-8 w-8" />;
      default:
        return <Car className="h-8 w-8" />;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map(category => (
        <Link key={category.id} to={`/category/${category.id}`}>
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 h-full border border-muted bg-white hover:border-brand-orange group">
            <CardContent className="p-6 text-center">
              <div className="mb-4 text-primary flex justify-center group-hover:text-brand-orange transition-colors duration-300">
                {getCategoryIcon(category.id)}
              </div>
              <h3 className="font-semibold text-sm mb-2 group-hover:text-brand-orange">{category.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {category.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default CategoryGrid;

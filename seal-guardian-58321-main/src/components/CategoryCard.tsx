import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '@/types/catalog';
import { ChevronRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link to={`/category/${category.id}`} className="group block">
      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:border-orange-100 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 flex flex-col h-full">
        <div className="relative overflow-hidden aspect-[16/9]">
          <div className="absolute inset-0 bg-slate-50 group-hover:bg-orange-50 transition-colors duration-500" />
          <img
            src={category.image || "/placeholder.svg"}
            alt={category.name}
            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Subtle Hover Indicator */}
          <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <div className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-white flex items-center justify-center text-brand-orange">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-orange transition-colors duration-300 leading-tight mb-2">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
              {category.description}
            </p>
          )}
          <div className="mt-auto pt-6 flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-brand-orange transition-colors">View Products</span>
            <div className="h-px bg-slate-50 group-hover:bg-orange-50 flex-1 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;

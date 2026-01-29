
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Category } from '@/types/catalog';

interface ProductBreadcrumbsProps {
  productName: string;
  category?: Category;
  parentCategory?: Category | null;
}

const ProductBreadcrumbs: React.FC<ProductBreadcrumbsProps> = ({
  productName,
  category,
  parentCategory
}) => {
  return (
    <div className="text-sm overflow-x-auto no-scrollbar py-2">
      <ul className="flex items-center space-x-2 whitespace-nowrap">
        <li className="flex items-center gap-2">
          <Link to="/catalogue" className="text-muted-foreground hover:text-brand-orange transition-colors font-medium">Catalogue</Link>
          <ChevronRight className="h-3 w-3 text-slate-300" />
        </li>

        {parentCategory && (
          <li className="flex items-center gap-2">
            <Link to={`/category/${parentCategory.id}`} className="text-muted-foreground hover:text-brand-orange transition-colors font-medium">
              {parentCategory.name}
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
          </li>
        )}

        {category && (
          <li className="flex items-center gap-2">
            <Link to={`/category/${category.id}`} className="text-muted-foreground hover:text-brand-orange transition-colors font-medium">
              {category.name}
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-300" />
          </li>
        )}

        <li className="font-bold text-slate-900 truncate max-w-[200px] md:max-w-[400px]" title={productName}>
          {productName}
        </li>
      </ul>
    </div>
  );
};

export default ProductBreadcrumbs;

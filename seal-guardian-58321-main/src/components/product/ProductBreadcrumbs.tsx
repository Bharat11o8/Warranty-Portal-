
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
    <div className="text-sm breadcrumbs">
      <ul className="flex items-center space-x-2">
        <li><Link to="/catalogue" className="text-muted-foreground hover:text-foreground">Home</Link></li>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />

        {parentCategory && (
          <>
            <li>
              <Link to={`/category/${parentCategory.id}`} className="text-muted-foreground hover:text-foreground">
                {parentCategory.name}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </>
        )}

        {category && (
          <>
            <li>
              <Link to={`/category/${category.id}`} className="text-muted-foreground hover:text-foreground">
                {category.name}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </>
        )}

        <li className="font-medium">{productName}</li>
      </ul>
    </div>
  );
};

export default ProductBreadcrumbs;

import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface ProductActionsProps {
  productId: string;
  productName: string;
  price: number;
  inStock?: boolean;
}

const ProductActions: React.FC<ProductActionsProps> = ({ productId, productName, price, inStock = true }) => {
  const handleWhatsAppShare = () => {
    const numericPrice = Number(price);
    const priceDisplay = !isNaN(numericPrice) ? numericPrice.toLocaleString() : 'Price varies';
    const message = `Check out this product: ${productName} - ₹${priceDisplay}. View more details at: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" className="w-full" onClick={handleWhatsAppShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Share on WhatsApp
      </Button>
    </div>
  );
};

export default ProductActions;

import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface ProductActionsProps {
  productId: string;
  productName: string;
  price: number;
  inStock?: boolean;
  selectedVariation?: any;
}

// The product catalogue is browse-only — no one (including franchises) orders
// from here. Ordering happens in the dedicated B2B order flow. This surface
// only offers sharing.
const ProductActions: React.FC<ProductActionsProps> = ({
  productName,
  price,
}) => {
  const handleWhatsAppShare = () => {
    const numericPrice = Number(price);
    const hasPrice = price > 0 && !isNaN(numericPrice);
    const message = hasPrice
      ? `Check out this product: ${productName} - ₹${numericPrice.toLocaleString()}. View more details at: ${window.location.href}`
      : `Check out this product: ${productName}. View more details at: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <Button
        className="w-full h-12 bg-brand-orange hover:bg-brand-orange/90 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-brand-orange/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        onClick={handleWhatsAppShare}
      >
        <Share2 className="mr-2 h-5 w-5" />
        Share on WhatsApp
      </Button>
    </div>
  );
};

export default ProductActions;

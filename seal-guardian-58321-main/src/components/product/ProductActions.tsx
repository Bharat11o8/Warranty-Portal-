import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, ShoppingCart, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useB2BCart } from '@/contexts/B2BCartContext';

interface ProductActionsProps {
  productId: string;
  productName: string;
  price: number;
  inStock?: boolean;
  selectedVariation?: any;
}

const ProductActions: React.FC<ProductActionsProps> = ({
  productId,
  productName,
  price,
  inStock,
  selectedVariation
}) => {
  const { user } = useAuth();
  const { addToCart, isDistributor } = useB2BCart();
  const [qty, setQty] = useState(1);

  const handleWhatsAppShare = () => {
    const numericPrice = Number(price);
    const hasPrice = price > 0 && !isNaN(numericPrice);
    const message = hasPrice
      ? `Check out this product: ${productName} - ₹${numericPrice.toLocaleString()}. View more details at: ${window.location.href}`
      : `Check out this product: ${productName}. View more details at: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddToCart = () => {
    const variationId = selectedVariation?.id || 'default';
    const variationName = selectedVariation?.name || 'Default';

    addToCart({
      productId,
      variationId,
      productName,
      variationName,
      price: Number(price || 0),
      stockQuantity: 999999,
      sku: productId
    }, qty);
  };

  if (user?.role === 'vendor' && !isDistributor) {
    return (
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Quantity:</span>
          <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm w-fit">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="h-10 w-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center text-sm font-bold text-slate-800">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="h-10 w-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Button
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-5 w-5" />
          Add to Order
        </Button>
      </div>
    );
  }

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

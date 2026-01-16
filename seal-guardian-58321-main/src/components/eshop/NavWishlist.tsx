
import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';

const NavWishlist = () => {
  const { 
    getWishlistItemsWithDetails, 
    wishlistItems, 
    removeFromWishlist 
  } = useWishlist();

  const wishlistProducts = getWishlistItemsWithDetails();
  const itemCount = wishlistItems.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Heart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Your Wishlist</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {wishlistProducts.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Your wishlist is empty</p>
          </div>
        ) : (
          <>
            <div className="max-h-[300px] overflow-auto">
              {wishlistProducts.map(product => (
                <DropdownMenuItem key={product.id} className="flex items-center p-4 focus:bg-transparent cursor-default">
                  <div className="w-12 h-12 flex-shrink-0 mr-3">
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-grow">
                    <Link to={`/product/${product.id}`} className="text-sm font-medium hover:text-primary">
                      {product.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      ₹{product.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="ml-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromWishlist(product.id);
                      }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            
            <div className="p-4">
              <Link to="/wishlist" className="w-full">
                <Button className="w-full">View Wishlist</Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavWishlist;

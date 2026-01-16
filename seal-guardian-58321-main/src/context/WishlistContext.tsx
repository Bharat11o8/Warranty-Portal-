import React, { createContext, useContext, useState, useCallback } from 'react';

interface WishlistContextType {
    wishlist: string[];
    addToWishlist: (productId: string) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlist, setWishlist] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wishlist');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const addToWishlist = useCallback((productId: string) => {
        setWishlist((prev) => {
            const updated = [...prev, productId];
            localStorage.setItem('wishlist', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const removeFromWishlist = useCallback((productId: string) => {
        setWishlist((prev) => {
            const updated = prev.filter((id) => id !== productId);
            localStorage.setItem('wishlist', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const isInWishlist = useCallback((productId: string) => {
        return wishlist.includes(productId);
    }, [wishlist]);

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

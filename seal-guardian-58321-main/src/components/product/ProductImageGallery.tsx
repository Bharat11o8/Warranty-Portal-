import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, productName }) => {
  const [mainImage, setMainImage] = useState(images[0] || "/placeholder.svg");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length > 0) {
      setMainImage(images[0]);
      setCurrentIndex(0);
    }
  }, [images]);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setMainImage(images[nextIndex]);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setMainImage(images[prevIndex]);
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setMainImage(images[index]);
    setIsLightboxOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Main Feature Image with Zoom Trigger */}
      <div
        className="group relative border rounded-2xl overflow-hidden bg-white cursor-zoom-in shadow-sm hover:shadow-md transition-all duration-300"
        onClick={() => openLightbox(currentIndex)}
      >
        <img
          src={mainImage}
          alt={productName}
          className="object-contain w-full h-[300px] md:h-[450px] transition-transform duration-500 group-hover:scale-105"
        />

        {/* Professional Zoom Indicator on Hover */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/90 p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <ZoomIn className="h-6 w-6 text-brand-orange" />
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex flex-wrap gap-3 mt-4">
        {images.map((image, index) => (
          <button
            key={index}
            className={cn(
              "group relative w-16 h-16 md:w-20 md:h-20 cursor-pointer border-2 rounded-2xl overflow-hidden transition-all duration-500",
              currentIndex === index
                ? 'border-brand-orange shadow-lg scale-105 z-10'
                : 'border-white hover:border-orange-200 bg-white hover:shadow-md'
            )}
            onClick={() => {
              setMainImage(image);
              setCurrentIndex(index);
            }}
          >
            <img
              src={image}
              alt={`${productName} thumbnail ${index + 1}`}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            />
            {currentIndex === index && (
              <div className="absolute inset-0 bg-brand-orange/5 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Minimalist Image-Only Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-screen h-screen p-0 overflow-hidden bg-transparent border-none shadow-none flex flex-col items-center justify-center outline-none select-none !duration-500">
          <DialogTitle className="sr-only">Zoomed Product Image: {productName}</DialogTitle>

          {/* We rely on the default DialogContent close button (top-right) 
          to avoid a duplicate "X" icon. */}

          <div className="relative group/lightbox flex flex-col items-center justify-center w-full h-full max-h-screen">
            {/* The Image - Maximized Focus */}
            <div className="relative flex flex-col items-center justify-center w-full max-h-[90vh]">
              <div className="relative">
                <img
                  src={images[currentIndex]}
                  alt={productName}
                  className="max-w-[95vw] max-h-[80vh] md:max-h-[85vh] object-contain drop-shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-700"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Navigation Arrows - Large & Elegant */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                      className="absolute left-0 md:-left-24 top-1/2 -translate-y-1/2 p-6 text-white/20 hover:text-white transition-all active:scale-90"
                    >
                      <ChevronLeft className="h-12 w-12 md:h-24 md:w-24 stroke-[0.5px]" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleNext(); }}
                      className="absolute right-0 md:-right-24 top-1/2 -translate-y-1/2 p-6 text-white/20 hover:text-white transition-all active:scale-90"
                    >
                      <ChevronRight className="h-12 w-12 md:h-24 md:w-24 stroke-[0.5px]" />
                    </button>
                  </>
                )}
              </div>

              {/* Pagination Dots - Moved closer to image */}
              {images.length > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500",
                        currentIndex === i
                          ? "w-10 bg-white"
                          : "w-1.5 bg-white/20 hover:bg-white/40"
                      )}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductImageGallery;

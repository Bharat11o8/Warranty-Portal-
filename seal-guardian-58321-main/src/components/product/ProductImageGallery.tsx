import React, { useState, useEffect } from "react";
import { Play, ZoomIn, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  videos?: string[];
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, videos = [], productName }) => {
  const allMedia = [...images.map(url => ({ url, type: 'image' })), ...videos.map(url => ({ url, type: 'video' }))];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images, videos]);

  const currentMedia = allMedia[currentIndex] || { url: "/placeholder.svg", type: 'image' };

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|mov|ogg)$/) || url.includes('/video/upload/');
  };

  const handleNext = () => {
    setCurrentIndex((currentIndex + 1) % allMedia.length);
  };

  const handlePrev = () => {
    setCurrentIndex((currentIndex - 1 + allMedia.length) % allMedia.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Feature Media */}
      <div className="group relative border rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300">
        <div className="relative h-[300px] md:h-[450px] w-full flex items-center justify-center">
          {currentMedia.type === 'video' || isVideo(currentMedia.url) ? (
            <video
              src={currentMedia.url}
              controls={isLightboxOpen}
              autoPlay
              muted
              loop
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={currentMedia.url}
              alt={productName}
              className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
            />
          )}

          {currentMedia.type !== 'video' && !isVideo(currentMedia.url) && (
            <div
              className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
            >
              <div className="bg-white/90 p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <ZoomIn className="h-6 w-6 text-brand-orange" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex flex-wrap gap-3 mt-4">
        {allMedia.map((media, index) => (
          <button
            key={index}
            className={cn(
              "group relative w-16 h-16 md:w-20 md:h-20 cursor-pointer border-2 rounded-2xl overflow-hidden transition-all duration-500",
              currentIndex === index
                ? 'border-brand-orange shadow-lg scale-105 z-10'
                : 'border-white hover:border-orange-200 bg-white hover:shadow-md'
            )}
            onClick={() => setCurrentIndex(index)}
          >
            {media.type === 'video' || isVideo(media.url) ? (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                <Play className="h-6 w-6 text-white opacity-50" />
                <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white uppercase bg-black/40 px-1 rounded">Video</span>
              </div>
            ) : (
              <img
                src={media.url}
                alt={`${productName} thumbnail ${index + 1}`}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
              />
            )}
            {currentIndex === index && (
              <div className="absolute inset-0 bg-brand-orange/5 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Lightbox for Media */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-screen h-screen p-0 overflow-hidden bg-black/95 border-none shadow-none flex flex-col items-center justify-center outline-none select-none">
          <DialogTitle className="sr-only">Zoomed Product Media: {productName}</DialogTitle>
          <div className="relative flex flex-col items-center justify-center w-full h-full">
            <div className="relative max-w-[95vw] max-h-[85vh]">
              {currentMedia.type === 'video' || isVideo(currentMedia.url) ? (
                <video src={currentMedia.url} controls autoPlay className="max-w-full max-h-full object-contain" />
              ) : (
                <img src={currentMedia.url} alt={productName} className="max-w-full max-h-full object-contain" />
              )}

              {allMedia.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-4 text-white hover:text-brand-orange transition-colors">
                    <ChevronLeft className="h-12 w-12" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-4 text-white hover:text-brand-orange transition-colors">
                    <ChevronRight className="h-12 w-12" />
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductImageGallery;

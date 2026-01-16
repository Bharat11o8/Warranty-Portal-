import React, { useState, useEffect } from 'react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, productName }) => {
  const [mainImage, setMainImage] = useState(images[0] || "/placeholder.svg");

  useEffect(() => {
    if (images.length > 0) {
      setMainImage(images[0]);
    }
  }, [images]);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-white">
        <img
          src={mainImage}
          alt={productName}
          className="object-contain w-full h-[400px]"
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className={`cursor-pointer border rounded-md overflow-hidden ${mainImage === image ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setMainImage(image)}
          >
            <img
              src={image}
              alt={`${productName} ${index + 1}`}
              className="object-cover w-full h-24"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;

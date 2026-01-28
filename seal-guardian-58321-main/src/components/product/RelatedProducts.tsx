
import React from 'react';
import { Product } from '@/types/catalog';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '../launch/ScrollReveal';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";

interface RelatedProductsProps {
  products: Product[];
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ products }) => {
  const [api, setApi] = React.useState<CarouselApi>();

  // Auto-advance logic
  React.useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [api]);

  if (products.length === 0) return null;

  return (
    <section className="mt-16 mb-12 overflow-hidden">
      <div className="flex flex-col gap-1.5 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-brand-orange rounded-full" />
          <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            Related <span className="text-brand-orange/90 font-medium lowercase italic">Products</span>
          </h2>
        </div>
      </div>

      <div className="relative px-2 md:-mx-4">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4 md:-ml-8">
            {products.map((product, idx) => (
              <CarouselItem key={product.id} className="pl-4 md:pl-8 basis-full md:basis-1/2 lg:basis-1/3">
                <ScrollReveal animation="fadeInUp" delay={idx * 100}>
                  <ProductCard product={product} />
                </ScrollReveal>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden lg:block">
            <CarouselPrevious className="-left-14 h-12 w-12 bg-white border-gray-100 hover:bg-brand-orange hover:text-white transition-all duration-300 shadow-xl" />
            <CarouselNext className="-right-14 h-12 w-12 bg-white border-gray-100 hover:bg-brand-orange hover:text-white transition-all duration-300 shadow-xl" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default RelatedProducts;

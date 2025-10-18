// components/FeaturedProducts.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

type APIImage = {
  mime: string;
  path: string;
  size: number;
  filename: string;
  originalName: string;
};

type APIProduct = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  countryOfOrigin: string;
  category: string;
  subcategory: string;
  description: string;
  images: APIImage[];
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

function buildAssetUrl(path: string | undefined) {
  if (!path) return undefined;
  const base = apiBase().replace(/\/$/, "");
  if (path.startsWith("http")) return path;
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}

// Shuffle array helper using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function FeaturedProducts() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<APIProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const PRODUCTS_PER_SLIDE = 3;
  const AUTO_SLIDE_INTERVAL = 10000; // 10 seconds

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const res = await fetch(`${apiBase()}/api/products`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }).catch((err) => {
          console.error("Network error:", err);
          throw new Error("Cannot connect to backend. Please start the server.");
        });
        
        if (!res.ok) throw new Error("Failed to load products");
        
        const json = await res.json();
        const products: APIProduct[] = Array.isArray(json.data) ? json.data : [];
        
        // Shuffle and take random 6 products
        const shuffled = shuffleArray(products);
        setAllProducts(shuffled.slice(0, 6));
      } catch (error) {
        console.error("Error loading featured products:", error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (allProducts.length === 0) return;

    const totalSlides = Math.ceil(allProducts.length / PRODUCTS_PER_SLIDE);
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [allProducts.length]);

  const totalSlides = Math.ceil(allProducts.length / PRODUCTS_PER_SLIDE);
  const currentProducts = allProducts.slice(
    currentSlide * PRODUCTS_PER_SLIDE,
    (currentSlide + 1) * PRODUCTS_PER_SLIDE
  );

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  if (loading) {
    return (
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">Loading featured products...</p>
        </div>
      </section>
    );
  }

  if (allProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900 relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge 
            variant="outline" 
            className="mb-4 text-[#88CEDC] border-[#88CEDC]/30"
          >
            Featured Products
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Premium African Exports
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover tokenized products from verified producers across the continent
          </p>
        </div>

        {/* Products Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-[#88CEDC]" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-[#88CEDC]" />
              </button>
            </>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentProducts.map((product, index) => {
              const firstImage = buildAssetUrl(product.images?.[0]?.path);

              return (
                <Card
                  key={product.id}
                  className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => router.push(`/product-details/${product.id}`)}
                >
                  {/* Product Image */}
                  <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}

                    {/* Verified Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-[#88CEDC] hover:bg-[#88CEDC]/90 text-white border-0">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white text-gray-900 hover:bg-white/90 font-semibold">
                        {Math.round(product.pricePerUnit * product.quantity)} HBAR
                      </Badge>
                    </div>

                    {/* Location Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="flex items-center gap-1 text-white text-sm">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{product.countryOfOrigin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-1">
                      {product.description || `${product.category} - ${product.subcategory}`}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.quantity} {product.unit} available
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#88CEDC] hover:text-[#88CEDC]/80 hover:bg-[#88CEDC]/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/product-details/${product.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Slide Indicators */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-2 mb-8">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-8 bg-[#88CEDC]"
                      : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-6 text-lg rounded-full font-semibold"
            onClick={() => router.push("/marketplace")}
          >
            View All Products →
          </Button>
        </div>
      </div>
    </section>
  );
}
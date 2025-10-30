// components/ProductDetails.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Coins, 
  AlertTriangle, 
  MapPin, 
  Package, 
  TrendingUp, 
  FileText, 
  Clock, 
  Download,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { constructApiUrl, constructImageUrl } from "@/config/api";
import Footer from "@/components/Footer";

type Product = {
  id: string | number;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  countryOfOrigin: string;
  category?: string;
  subcategory?: string;
  description: string;
  hsCode?: string;
  incoterm?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  images?: Array<{ path: string; originalName?: string }>;
  documents?: Array<{ path: string; originalName?: string }>;
  createdAt?: string;
  updatedAt?: string;
  hederaTokenId?: string;
};

function fmtMoney(n?: number) {
  if (typeof n !== "number" || Number.isNaN(n)) {
    return <span>-</span>;
  }

  const formatted = new Intl.NumberFormat(undefined, {
    style: "decimal",
    maximumFractionDigits: 8,
  }).format(n);

  return (
    <span className="flex items-center gap-2">
      <span className="text-4xl font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">{formatted}</span>
      <span
        className="inline-block w-6 h-6 bg-contain bg-no-repeat flex-shrink-0"
        style={{ backgroundImage: `url(/assets/hbar_logo.png)` }}
      />
      <span className="text-lg text-gray-600 dark:text-gray-400">HBAR</span>
    </span>
  );
}

function listifyMedia<T extends { path: string; originalName?: string }>(arr?: T[]) {
  if (!arr || arr.length === 0) return [];
  return arr.map((f) => ({
    url: constructImageUrl(f.path),
    name: f.originalName ?? f.path.split("/").pop(),
  }));
}

export default function ProductDetails({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(constructApiUrl(`/api/products/${id}`));
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = (await res.json()) as Product;
        if (!cancelled) setProduct(data);
      } catch (e: unknown) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const imgs = useMemo(() => listifyMedia(product?.images), [product?.images]);
  const docs = useMemo(() => listifyMedia(product?.documents), [product?.documents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-[#88CEDC] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 pt-32 px-6">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="backdrop-blur-xl bg-red-50/80 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/50">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Couldn&apos;t load product</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
          <a href="/marketplace" className="hover:text-[#88CEDC] transition-colors">Marketplace</a>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Product Details</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 aspect-square group">
              {imgs.length > 0 ? (
                <>
                  <img
                    src={imgs[selectedImage]?.url || imgs[0]?.url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-400" />
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-6 left-6 right-6 flex items-start justify-between">
                <div className="flex gap-2 flex-wrap">
                  {product.category && (
                    <Badge className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl text-gray-900 dark:text-white border-0 shadow-lg px-4 py-2">
                      {product.category}
                    </Badge>
                  )}
                  {product.subcategory && (
                    <Badge className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl text-gray-900 dark:text-white border-0 shadow-lg px-4 py-2">
                      {product.subcategory}
                    </Badge>
                  )}
                </div>
                {product.incoterm && (
                  <Badge className="bg-green-500 text-white border-0 shadow-lg px-4 py-2">
                    {product.incoterm}
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Grid */}
            {imgs.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {imgs.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative rounded-2xl overflow-hidden aspect-square transition-all duration-300 ${
                      selectedImage === idx
                        ? "ring-4 ring-[#88CEDC] scale-105"
                        : "ring-2 ring-gray-200 dark:ring-gray-800 hover:ring-[#88CEDC]/50 hover:scale-105"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Title & Country */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-[#88CEDC]" />
                  <span className="font-medium text-gray-900 dark:text-white">{product.countryOfOrigin}</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {product.name}
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Price Card */}
            <Card className="p-6 bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 border-[#88CEDC]/20 dark:border-[#88CEDC]/30 backdrop-blur-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Price per {product.unit}</div>
              {fmtMoney(product.pricePerUnit)}
            </Card>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-5 h-5 text-[#88CEDC]" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quantity</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.quantity.toLocaleString()} <span className="text-base font-normal text-gray-600 dark:text-gray-400">{product.unit}</span>
                </p>
              </Card>

              <Card className="p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-[#88CEDC]" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Min Order</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.minOrderQty ? `${product.minOrderQty} ${product.unit}` : "No minimum"}
                </p>
              </Card>

              {product.leadTimeDays && (
                <Card className="p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 col-span-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-[#88CEDC]" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Lead Time</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {product.leadTimeDays} days
                  </p>
                </Card>
              )}
            </div>

            {/* Action Button */}
            {product.hederaTokenId && (
              <Button 
                className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#5BA8B8] hover:to-[#88CEDC] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  window.open(
                    `https://hashscan.io/testnet/token/${product.hederaTokenId}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                View on HashScan
              </Button>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-[#88CEDC]" />
              <h3 className="font-bold text-gray-900 dark:text-white">Product Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">HS Code</span>
                <p className="font-medium text-gray-900 dark:text-white">{product.hsCode || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Product ID</span>
                <p className="font-medium text-gray-900 dark:text-white">#{product.id}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-[#88CEDC]" />
              <h3 className="font-bold text-gray-900 dark:text-white">Shipping Info</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Incoterm</span>
                <p className="font-medium text-gray-900 dark:text-white">{product.incoterm || "-"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Origin</span>
                <p className="font-medium text-gray-900 dark:text-white">{product.countryOfOrigin}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-[#88CEDC]" />
              <h3 className="font-bold text-gray-900 dark:text-white">Timeline</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Listed Date</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {product.createdAt
                    ? new Date(product.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>
          
            </div>
          </Card>
        </div>

        {/* Documents Section */}
        {docs.length > 0 && (
          <Card className="p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-[#88CEDC]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Certificates & Documents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-[#88CEDC]/10 dark:hover:bg-[#88CEDC]/10 border border-gray-200 dark:border-gray-700 hover:border-[#88CEDC] transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#88CEDC]/10 flex items-center justify-center group-hover:bg-[#88CEDC] transition-colors">
                      <Download className="w-5 h-5 text-[#88CEDC] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to download</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>
       <Footer />
    </div>
  );
}
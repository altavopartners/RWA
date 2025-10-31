"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
// import { useAuth } from '@/hooks/useAuth'
import {
  Search,
  Filter,
  MapPin,
  FileCheck,
  Coins,
  PlusCircle,
  ExternalLink,
  Package,
} from "lucide-react";
import AddToCartPopup from "@/components/AddToCartPopup";

function money(n: number, product: { unit: string } = { unit: "unit" }) {
  const formatted = new Intl.NumberFormat(undefined, {
    style: "decimal",
    maximumFractionDigits: 8,
  }).format(n);

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-2xl font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">{formatted}</span>
      <span
        className="inline-block w-5 h-5 bg-contain bg-no-repeat flex-shrink-0"
        style={{ backgroundImage: `url(/assets/hbar_logo.png)` }}
      />
      <span className="font-normal">BAR</span>
      <span className="text-sm text-gray-600 dark:text-gray-400">/{product.unit}</span>
    </span>
  );
}

// =====================
// 1) API types (from your example)
// =====================
export type APIImage = {
  mime: string;
  path: string; // e.g. "/uploads/images/....png"
  size: number;
  filename: string;
  originalName: string;
};

export type APIDocument = {
  mime: string;
  path: string;
  size: number;
  filename: string;
  originalName: string;
};

export type APIProduct = {
  id: number;
  name: string;
  quantity: number; // e.g. 10030
  unit: string; // e.g. "kg"
  pricePerUnit: number; // e.g. 2.5
  countryOfOrigin: string; // e.g. "Ghana"
  category: string; // e.g. "agri"
  subcategory: string; // e.g. "cocoa"
  description: string;
  hsCode?: string;
  incoterm?: string; // e.g. "FOB"
  hederaTokenId?: string; // e.g. "0.0.12345"
  minOrderQty?: number;
  leadTimeDays?: number;
  images: APIImage[];
  documents: APIDocument[];
  createdAt: string;
  updatedAt: string;
};

export type APIResponse = {
  data: APIProduct[];
};

// =====================
// 2) Category/subcategory filters (as before)
// =====================
const categories = [
  { id: "agri", label: "Agricultural Products", icon: "🌾" },
  { id: "raw", label: "Raw Materials", icon: "⛏️" },
  { id: "processed", label: "Processed Goods", icon: "🏭" },
  { id: "manufactured", label: "Manufactured Items", icon: "📦" },
];

const subcategories: Record<string, { id: string; label: string }[]> = {
  agri: [
    { id: "coffee", label: "Coffee Beans" },
    { id: "cocoa", label: "Cocoa Beans" },
    { id: "tea", label: "Tea Leaves" },
    { id: "fruits", label: "Fruits & Vegetables" },
    { id: "nuts-oilseeds", label: "Nuts & Oilseeds" },
    { id: "spices", label: "Spices" },
  ],
  raw: [
    { id: "crude-oil", label: "Crude Oil" },
    { id: "natural-gas", label: "Natural Gas" },
    { id: "gold", label: "Gold" },
    { id: "diamonds", label: "Diamonds" },
    { id: "copper", label: "Copper" },
    { id: "iron-ore", label: "Iron Ore" },
  ],
  processed: [
    { id: "edible-oils", label: "Edible Oils" },
    { id: "cocoa-products", label: "Cocoa Products" },
    { id: "roasted-coffee-tea", label: "Roasted Coffee & Tea" },
    { id: "refined-sugar", label: "Refined Sugar" },
    { id: "processed-fruits", label: "Processed Fruits" },
    { id: "leather-tanned", label: "Leather (Tanned)" },
    { id: "textile-yarn", label: "Textile Yarn & Fabrics" },
  ],
  manufactured: [
    { id: "textiles-apparel", label: "Textiles & Apparel" },
    { id: "footwear", label: "Footwear & Leather Goods" },
    { id: "vehicles", label: "Vehicles & Parts" },
    { id: "machinery", label: "Machinery & Equipment" },
    { id: "electronics", label: "Electrical Equipment" },
    { id: "building-materials", label: "Building Materials" },
  ],
};

// =====================
// 3) Helpers
// =====================
function apiBase() {
  // Configure in .env as NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
}

function buildAssetUrl(path: string | undefined) {
  if (!path) return undefined;
  // Most backends serve uploads under the same origin as the API base
  // e.g. http://localhost:4000/uploads/...
  const base = apiBase().replace(/\/$/, "");
  if (path.startsWith("http")) return path; // already absolute
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}

// =====================
// 4) Component
// =====================
const Marketplace = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | string>(
    "all"
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    "all" | string
  >("all");

  const [products, setProducts] = useState<APIProduct[]>([]);
  const [loading, setLoading] = useState(false); // Start with false instead of true
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false); // Track if data has been loaded

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/api/products`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }
      const json: APIResponse = await res.json();
      setProducts(Array.isArray(json.data) ? json.data : []);
      setHasLoaded(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-load products when marketplace component mounts (user navigated to marketplace)
    if (!hasLoaded) {
      loadProducts();
    }
  }, [hasLoaded]);

  const handleSelectCategory = (id: string) => {
    setSelectedCategory(id);
    setSelectedSubcategory("all");
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.countryOfOrigin.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      const matchesSubcategory =
        selectedCategory === "all" ||
        selectedSubcategory === "all" ||
        p.subcategory === selectedSubcategory;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [products, searchQuery, selectedCategory, selectedSubcategory]);

  const activeSubcats =
    selectedCategory !== "all" ? subcategories[selectedCategory] ?? [] : [];

  return (
    <div className=" min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#486C7A] via-[#265663] to-[#0C171B] pt-16 pb-28 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#88CEDC] rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-full blur-3xl opacity-30" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10 container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight" style={{ color: '#edf6f9' }}>
              Global Marketplace
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Discover authentic African products from verified producers
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <Input
                  placeholder="Search products, countries, descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-6 py-7 text-lg rounded-2xl border-0 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-12 relative z-20">
        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div
            onClick={() => handleSelectCategory("all")}
            className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 group ${
              selectedCategory === "all"
                ? "bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] text-white shadow-2xl shadow-[#88CEDC]/30"
                : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl hover:shadow-xl border border-gray-200/50 dark:border-gray-800/50"
            }`}
          >
            <div className="text-center relative z-10">
              <div className={`text-4xl mb-3 ${selectedCategory === "all" ? "drop-shadow-lg" : ""}`}>✨</div>
              <h3 className="font-bold text-sm mb-1">All Categories</h3>
              <p className={`text-xs opacity-80 ${selectedCategory === "all" ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                {products.length} items
              </p>
            </div>
            {selectedCategory !== "all" && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#88CEDC]/0 to-[#5BA8B8]/0 group-hover:from-[#88CEDC]/5 group-hover:to-[#5BA8B8]/5 rounded-2xl transition-all duration-300" />
            )}
          </div>

          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleSelectCategory(category.id)}
              className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 group ${
                selectedCategory === category.id
                  ? "bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] text-white shadow-2xl shadow-[#88CEDC]/30"
                  : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl hover:shadow-xl border border-gray-200/50 dark:border-gray-800/50"
              }`}
            >
              <div className="text-center relative z-10">
                <div className={`text-4xl mb-3 ${selectedCategory === category.id ? "drop-shadow-lg" : ""}`}>
                  {category.icon}
                </div>
                <h3 className="font-bold text-sm">{category.label}</h3>
              </div>
              {selectedCategory !== category.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#88CEDC]/0 to-[#5BA8B8]/0 group-hover:from-[#88CEDC]/5 group-hover:to-[#5BA8B8]/5 rounded-2xl transition-all duration-300" />
              )}
            </div>
          ))}
        </div>

        {/* Subcategory Pills */}
        {selectedCategory !== "all" && activeSubcats.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
              Refine: Subcategories
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge
                onClick={() => setSelectedSubcategory("all")}
                className={`px-6 py-2.5 cursor-pointer text-sm transition-all duration-300 rounded-full ${
                  selectedSubcategory === "all"
                    ? "bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] text-white shadow-lg shadow-[#88CEDC]/30 scale-105"
                    : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 hover:scale-105 border border-gray-200/50 dark:border-gray-800/50"
                }`}
              >
                All Subcategories
              </Badge>

              {activeSubcats.map((sub) => (
                <Badge
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`px-6 py-2.5 cursor-pointer text-sm transition-all duration-300 rounded-full ${
                    selectedSubcategory === sub.id
                      ? "bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] text-white shadow-lg shadow-[#88CEDC]/30 scale-105"
                      : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 hover:scale-105 border border-gray-200/50 dark:border-gray-800/50"
                  }`}
                >
                  {sub.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Results Count / States */}
        <div className="mb-10">
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block w-12 h-12 rounded-full border-4 border-[#88CEDC]/20 border-t-[#88CEDC] animate-spin"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-6 font-medium">Loading products…</p>
            </div>
          )}
          {error && (
            <div className="relative p-8 text-center rounded-2xl bg-red-50/80 dark:bg-red-950/20 backdrop-blur-xl border border-red-200/50 dark:border-red-900/50">
              <p className="text-red-600 dark:text-red-400 mb-2 font-medium">
                {error}
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 mb-4">
                Check API is running at <code className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">{apiBase()}/api/products</code> and CORS.
              </p>
              <Button onClick={loadProducts} className="bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white shadow-lg">
                Retry Loading
              </Button>
            </div>
          )}
          {!loading && !error && hasLoaded && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
              <p className="text-gray-600 dark:text-gray-400">
                Showing <span className="font-bold text-lg bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">{filteredProducts.length}</span> products
              </p>
              <Button variant="outline" size="sm" className="gap-2 backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          )}
          {!hasLoaded && !loading && !error && (
            <div className="text-center py-16">
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                Ready to browse products
              </p>
              <div className="relative inline-block group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <Button onClick={loadProducts} className="relative bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white shadow-2xl rounded-2xl px-8 py-6 text-base">
                  Load Products
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredProducts.map((product, index) => {
            const firstImage = buildAssetUrl(product.images?.[0]?.path);
            return (
              <div
                key={product.id}
                className="group relative animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
                
                <Card className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 hover:border-[#88CEDC]/50 dark:hover:border-[#88CEDC]/50 transition-all duration-500 group-hover:shadow-2xl rounded-3xl">
                  {/* Product Image */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
                    {firstImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstImage || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                      <Badge className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl text-gray-900 dark:text-white border-0 shadow-lg">
                        <Coins className="w-3 h-3 mr-1" />
                        {product.category}/{product.subcategory}
                      </Badge>

                      {product.incoterm && (
                        <Badge className="bg-green-500 text-white border-0 shadow-lg">
                          <FileCheck className="w-3 h-3 mr-1" />
                          {product.incoterm}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white line-clamp-1 group-hover:bg-gradient-to-r group-hover:from-[#5BA8B8] group-hover:to-[#88CEDC] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                          {product.name}
                        </h3>
                        {product.hsCode && (
                          <Badge className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-0 shadow-md text-gray-900 dark:text-white ml-2 shrink-0">
                            HS {product.hsCode}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <MapPin className="w-4 h-4 mr-1.5 text-[#88CEDC]" />
                        <span className="font-medium">{product.countryOfOrigin}</span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          {money(product.pricePerUnit, { unit: product.unit })}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {product.quantity} {product.unit} available
                          </p>
                          {product.minOrderQty ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Min. order {product.minOrderQty} {product.unit}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 cursor-pointer bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 backdrop-blur-xl rounded-xl"
                          onClick={() =>
                            router.push(`/product-details/${product.id}`)
                          }
                        >
                          View Details
                        </Button>

                        <AddToCartPopup product={product} />
                      </div>

                      <Button
                        variant="ghost"
                        className="w-full mt-2 text-[#5BA8B8] hover:text-[#88CEDC] hover:bg-[#88CEDC]/10 rounded-xl"
                        onClick={() =>
                          window.open(
                            `https://hashscan.io/testnet/token/${product.hederaTokenId}`,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on hashscan.io
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Load More (placeholder) */}
        {hasLoaded && filteredProducts.length > 0 && (
          <div className="text-center pb-20">
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <Button size="lg" className="relative bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white shadow-2xl rounded-2xl px-8 py-6 text-base">
                <PlusCircle className="w-5 h-5 mr-2" />
                Load More Products
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
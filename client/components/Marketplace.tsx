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
} from "lucide-react";
import AddToCartPopup from "@/components/AddToCartPopup";

function money(n: number, product: { unit: string } = { unit: "unit" }) {
  const formatted = new Intl.NumberFormat(undefined, {
    style: "decimal",
    maximumFractionDigits: 8,
  }).format(n);

  return (
    <span className="flex items-center gap-1">
      <span style={{ fontWeight: "normal" }}>{formatted}</span>
      <span
        className="inline-block w-4 h-4 bg-contain bg-no-repeat flex-shrink-0"
        style={{ backgroundImage: `url(/assets/hbar_logo.png)` }}
      />
      <span style={{ fontWeight: "normal" }}>BAR</span>
      <span className="text-gray-500 text-sm">/{product.unit}</span>
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
  { id: "agri", label: "Agricultural Products" },
  { id: "raw", label: "Raw Materials" },
  { id: "processed", label: "Processed Goods" },
  { id: "manufactured", label: "Manufactured Items" },
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
    } catch (e: any) {
      setError(e?.message || "Failed to load products");
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
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Global Marketplace</h1>
          <p className="text-muted-foreground">
            Discover authentic African products from verified producers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products, countries, descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="md:w-auto bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <Button
              key="all"
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelectCategory("all")}
              className="transition-smooth"
            >
              All Categories
            </Button>

            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => handleSelectCategory(category.id)}
                className="transition-smooth"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Subcategory Pills */}
          {selectedCategory !== "all" && activeSubcats.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <div className="text-sm text-muted-foreground">
                Refine: Subcategories
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  key="all-sub"
                  variant={
                    selectedSubcategory === "all" ? "secondary" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedSubcategory("all")}
                  className="transition-smooth"
                >
                  All Subcategories
                </Button>

                {activeSubcats.map((sub) => (
                  <Button
                    key={sub.id}
                    variant={
                      selectedSubcategory === sub.id ? "secondary" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className="transition-smooth"
                  >
                    {sub.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Count / States */}
        <div className="mb-6">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading products…</p>
          )}
          {error && (
            <div className="space-y-2">
              <p className="text-sm text-red-500">
                {error} — check API is running at{" "}
                <code>{apiBase()}/api/products</code> and CORS.
              </p>
              <Button variant="outline" size="sm" onClick={loadProducts}>
                Retry Loading
              </Button>
            </div>
          )}
          {!loading && !error && hasLoaded && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} products
            </p>
          )}
          {!hasLoaded && !loading && !error && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Ready to browse products
              </p>
              <Button onClick={loadProducts}>Load Products</Button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => {
            const firstImage = buildAssetUrl(product.images?.[0]?.path);
            return (
              <Card
                key={product.id}
                className="overflow-hidden glass border-border/50 hover:border-primary/50 transition-smooth group hover:shadow-card animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Product Image */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {firstImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={firstImage || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="glass">
                      <Coins className="w-3 h-3 mr-1" />
                      {product.category}/{product.subcategory}
                    </Badge>
                  </div>

                  {product.incoterm && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="default" className="bg-success">
                        <FileCheck className="w-3 h-3 mr-1" />
                        {product.incoterm}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {product.name}
                    </h3>
                    {product.hsCode && (
                      <Badge variant="outline">HS {product.hsCode}</Badge>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{product.countryOfOrigin}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="font-bold">
                        {money(product.pricePerUnit, { unit: product.unit })}
                      </span>
                     
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {product.quantity} {product.unit} available
                      </p>
                      {product.minOrderQty ? (
                        <p className="text-xs text-muted-foreground">
                          Min. order {product.minOrderQty}
                          {product.unit}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 cursor-pointer bg-transparent"
                      onClick={() =>
                        router.push(`/product-details/${product.id}`)
                      }
                    >
                      View Details
                    </Button>
                  

                    <AddToCartPopup product={product} />
                  </div>
                  
                  <div className="flex gap-4 mt-2 ml-4 mr-4">
                    <Button
                      variant="outline"
                      className="flex-1 cursor-pointer bg-transparent"
                      onClick={() =>
                        window.open(
                          `https://hashscan.io/testnet/token/${product.hederaTokenId}`,
                          "_blank", // ensures it opens in a new tab/window
                          "noopener,noreferrer" // security best practices
                        )}
                    >
                      View on hashscan.io
                    </Button>
                  

                  </div>
                    
                </div>
              </Card>
            );
          })}
        </div>

        {/* Load More (placeholder) */}
        {hasLoaded && filteredProducts.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              <PlusCircle className="w-4 h-4 mr-2" />
              Load More Products
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  ShoppingCart, 
  FileCheck,
  Coins,
  Globe
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  producer: string;
  country: string;
  price: number;
  quantity: number;
  rating: number;
  reviews: number;
  tokenId: string;
  certified: boolean;
  image: string;
  description: string;
  category: string;     // NEW
  subcategory: string;  // NEW
};

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

const mockProducts = [
  {
    id: "1",
    name: "Premium Ghanaian Cocoa Beans",
    producer: "Kwame Farms",
    country: "Ghana",
    price: 2.5,
    quantity: 1000,
    rating: 4.9,
    reviews: 156,
    tokenId: "0.0.1001",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/7/76/Cocoa_beans.jpg",
    description: "Organic cocoa beans from sustainable farms in Ghana's Ashanti region.",
    category: "agri",
    subcategory: "cocoa"
  },
  {
    id: "2",
    name: "Ethiopian Arabica Coffee Beans",
    producer: "Highland Coffee Co.",
    country: "Ethiopia",
    price: 8.5,
    quantity: 500,
    rating: 4.7,
    reviews: 203,
    tokenId: "0.0.1002",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Roasted_coffee_beans.jpg",
    description: "Single-origin Arabica coffee from Ethiopian highlands.",
    category: "agri",
    subcategory: "coffee"
  },
  {
    id: "3",
    name: "Kenyan Black Tea",
    producer: "Meru Tea Gardens",
    country: "Kenya",
    price: 12,
    quantity: 750,
    rating: 4.8,
    reviews: 167,
    tokenId: "0.0.1003",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Ceylon_black_tea_leaves.jpg",
    description: "High-altitude black tea with a rich flavor profile.",
    category: "agri",
    subcategory: "tea"
  },
  {
    id: "4",
    name: "Zanzibar Whole Cloves",
    producer: "Pemba Spice Collective",
    country: "Tanzania",
    price: 6,
    quantity: 300,
    rating: 4.8,
    reviews: 92,
    tokenId: "0.0.1004",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/3/33/Cloves.JPG",
    description: "Aromatic whole cloves sun-dried on the Spice Islands.",
    category: "agri",
    subcategory: "spices"
  },
  {
    id: "5",
    name: "Sudan Sesame Seeds (Hulled)",
    producer: "Nile Agritrade",
    country: "Sudan",
    price: 1.8,
    quantity: 10000,
    rating: 4.6,
    reviews: 58,
    tokenId: "0.0.1005",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Sesame_Seeds_-_NIAID.jpg",
    description: "High-oil content sesame seeds for pressing or confectionery.",
    category: "agri",
    subcategory: "nuts-oilseeds"
  },
  {
    id: "6",
    name: "Refined Gold Bullion (995+)",
    producer: "Ashanti Bullion",
    country: "Ghana",
    price: 65000,
    quantity: 50,
    rating: 4.9,
    reviews: 61,
    tokenId: "0.0.1006",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/a/af/Gold_bullion_bars.jpg",
    description: "Standard bullion bars meeting international assay specs.",
    category: "raw",
    subcategory: "gold"
  },
  {
    id: "7",
    name: "Botswana Rough Diamonds",
    producer: "Kgalagadi Traders",
    country: "Botswana",
    price: 4000,
    quantity: 15,
    rating: 4.9,
    reviews: 77,
    tokenId: "0.0.1007",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Diamonds.jpg",
    description: "Uncut rough diamonds sourced ethically from Botswana.",
    category: "raw",
    subcategory: "diamonds"
  },
  {
    id: "8",
    name: "Copper Cathodes Grade A",
    producer: "CopperBelt Metals Ltd.",
    country: "Zambia",
    price: 9100,
    quantity: 20000,
    rating: 4.7,
    reviews: 74,
    tokenId: "0.0.1008",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Copper_cathode_UMMCII_Uralelectromed.jpg",
    description: "LME Grade A copper cathodes suitable for global smelters.",
    category: "raw",
    subcategory: "copper"
  },
  {
    id: "9",
    name: "Moroccan Argan Oil",
    producer: "Atlas Cooperatives",
    country: "Morocco",
    price: 45,
    quantity: 100,
    rating: 4.9,
    reviews: 178,
    tokenId: "0.0.1009",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Argan_oil.jpg",
    description: "Pure argan oil extracted using traditional methods.",
    category: "processed",
    subcategory: "edible-oils"
  },
  {
    id: "10",
    name: "Roasted Kenyan Coffee",
    producer: "Nairobi Roasters",
    country: "Kenya",
    price: 14,
    quantity: 300,
    rating: 4.8,
    reviews: 88,
    tokenId: "0.0.1010",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/4/45/Coffee_beans.jpg",
    description: "Dark roast Kenyan coffee with chocolatey notes.",
    category: "processed",
    subcategory: "roasted-coffee-tea"
  },
  {
    id: "11",
    name: "Authentic Kente Cloth",
    producer: "Adoma Textiles",
    country: "Ghana",
    price: 150,
    quantity: 25,
    rating: 4.8,
    reviews: 89,
    tokenId: "0.0.1011",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Kentecloth.jpg",
    description: "Handwoven Kente cloth made by skilled artisans.",
    category: "manufactured",
    subcategory: "textiles-apparel"
  },
  {
    id: "12",
    name: "Ethiopian Leather Handbag",
    producer: "Addis Leatherworks",
    country: "Ethiopia",
    price: 85,
    quantity: 60,
    rating: 4.7,
    reviews: 41,
    tokenId: "0.0.1012",
    certified: true,
    image: "https://upload.wikimedia.org/wikipedia/commons/3/35/Leather_bag.jpg",
    description: "Genuine leather handbag crafted by Ethiopian artisans.",
    category: "manufactured",
    subcategory: "footwear"
  }
];




const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<"all" | string>("all");

  const handleSelectCategory = (id: string) => {
    setSelectedCategory(id);
    setSelectedSubcategory("all"); // reset subcategory whenever category changes
  };

  const filteredProducts = mockProducts.filter((product) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.producer.toLowerCase().includes(q) ||
      product.country.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSubcategory =
      selectedCategory === "all" ||
      selectedSubcategory === "all" ||
      product.subcategory === selectedSubcategory;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const activeSubcats = selectedCategory !== "all" ? subcategories[selectedCategory] ?? [] : [];

  return (
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Global Marketplace</h1>
          <p className="text-muted-foreground">Discover authentic African products from verified producers</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products, producers, or countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="md:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Pills (Top-Level) */}
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
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectCategory(category.id)}
                className="transition-smooth"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Subcategory Pills (Contextual, appears only when a category is selected) */}
          {selectedCategory !== "all" && activeSubcats.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <div className="text-sm text-muted-foreground">Refine: Subcategories</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  key="all-sub"
                  variant={selectedSubcategory === "all" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSubcategory("all")}
                  className="transition-smooth"
                >
                  All Subcategories
                </Button>

                {activeSubcats.map((sub) => (
                  <Button
                    key={sub.id}
                    variant={selectedSubcategory === sub.id ? "secondary" : "outline"}
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

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <Card 
              key={product.id} 
              className="overflow-hidden glass border-border/50 hover:border-primary/50 transition-smooth group hover:shadow-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Product Image */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="glass">
                    <Coins className="w-3 h-3 mr-1" />
                    {product.tokenId}
                  </Badge>
                </div>
                {product.certified && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="default" className="bg-success">
                      <FileCheck className="w-3 h-3 mr-1" />
                      Certified
                    </Badge>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                  <div className="flex items-center text-warning">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm ml-1">{product.rating}</span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{product.producer} • {product.country}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold ">
                      ${product.price}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">/kg</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{product.quantity}kg available</p>
                    <p className="text-xs text-muted-foreground">{product.reviews} reviews</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="hero" className="flex-1">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Order Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            <Globe className="w-4 h-4 mr-2" />
            Load More Products
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;

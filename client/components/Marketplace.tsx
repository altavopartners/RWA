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

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Products" },
    { id: "cocoa", label: "Cocoa & Coffee" },
    { id: "textiles", label: "Textiles" },
    { id: "spices", label: "Spices & Herbs" },
    { id: "crafts", label: "Handicrafts" },
  ];

  const mockProducts = [
    {
      id: "1",
      name: "Premium Ghanaian Cocoa Beans",
      producer: "Kwame Farms",
      country: "Ghana",
      price: 2.50,
      quantity: 1000,
      rating: 4.9,
      reviews: 156,
      tokenId: "0.0.123456",
      certified: true,
      image: "/placeholder.svg",
      description: "Organic cocoa beans from sustainable farms in Ghana's Ashanti region."
    },
    {
      id: "2",
      name: "Authentic Kente Cloth",
      producer: "Adoma Textiles",
      country: "Ghana",
      price: 150,
      quantity: 25,
      rating: 4.8,
      reviews: 89,
      tokenId: "0.0.789012",
      certified: true,
      image: "/placeholder.svg",
      description: "Handwoven traditional Kente cloth made by skilled artisans."
    },
    {
      id: "3",
      name: "Ethiopian Coffee Beans",
      producer: "Highland Coffee Co.",
      country: "Ethiopia",
      price: 8.50,
      quantity: 500,
      rating: 4.7,
      reviews: 203,
      tokenId: "0.0.345678",
      certified: true,
      image: "/placeholder.svg",
      description: "Single-origin Arabica coffee from Ethiopian highlands."
    },
    {
      id: "4",
      name: "Moroccan Argan Oil",
      producer: "Atlas Cooperatives",
      country: "Morocco",
      price: 45,
      quantity: 100,
      rating: 4.9,
      reviews: 178,
      tokenId: "0.0.567890",
      certified: true,
      image: "/placeholder.svg",
      description: "Pure argan oil extracted using traditional methods."
    },
    {
      id: "5",
      name: "Nigerian Shea Butter",
      producer: "Savanna Women's Coop",
      country: "Nigeria",
      price: 25,
      quantity: 200,
      rating: 4.6,
      reviews: 134,
      tokenId: "0.0.234567",
      certified: true,
      image: "/placeholder.svg",
      description: "Raw unrefined shea butter from Northern Nigeria."
    },
    {
      id: "6",
      name: "Kenyan Black Tea",
      producer: "Meru Tea Gardens",
      country: "Kenya",
      price: 12,
      quantity: 750,
      rating: 4.8,
      reviews: 167,
      tokenId: "0.0.890123",
      certified: true,
      image: "/placeholder.svg",
      description: "High-altitude grown black tea with rich flavor profile."
    }
  ];

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.producer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
                           (selectedCategory === "cocoa" && (product.name.includes("Cocoa") || product.name.includes("Coffee"))) ||
                           (selectedCategory === "textiles" && product.name.includes("Kente")) ||
                           (selectedCategory === "spices" && (product.name.includes("Oil") || product.name.includes("Butter"))) ||
                           (selectedCategory === "crafts" && product.name.includes("Tea"));
    
    return matchesSearch && matchesCategory;
  });

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

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="transition-smooth"
              >
                {category.label}
              </Button>
            ))}
          </div>
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
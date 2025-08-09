import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  Upload, 
  FileCheck, 
  Coins, 
  TrendingUp, 
  Eye,
  Plus,
  Camera
} from "lucide-react";

const ProducerDashboard = () => {
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [tokenizationProgress, setTokenizationProgress] = useState(0);

  const mockProducts = [
    {
      id: "1",
      name: "Premium Ghanaian Cocoa Beans",
      status: "listed",
      tokenId: "0.0.123456",
      price: 2.5,
      quantity: 1000,
      orders: 3,
      image: "/placeholder.svg"
    },
    {
      id: "2", 
      name: "Handwoven Kente Cloth",
      status: "draft",
      tokenId: null,
      price: 150,
      quantity: 50,
      orders: 0,
      image: "/placeholder.svg"
    }
  ];

  const handleTokenize = async () => {
    setIsTokenizing(true);
    setTokenizationProgress(0);

    // Simulate tokenization process
    const steps = [
      { label: "Uploading to IPFS...", progress: 25 },
      { label: "Creating HTS Token...", progress: 50 },
      { label: "Minting NFT...", progress: 75 },
      { label: "Listing on Marketplace...", progress: 100 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTokenizationProgress(step.progress);
    }

    setIsTokenizing(false);
    setTokenizationProgress(0);
  };

  return (
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Producer Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and track your exports</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 glass border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold gradient-accent bg-clip-text text-transparent">12</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 glass border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold gradient-accent bg-clip-text text-transparent">8</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </Card>

          <Card className="p-6 glass border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold gradient-accent bg-clip-text text-transparent">$25,400</p>
              </div>
              <Coins className="w-8 h-8 text-accent" />
            </div>
          </Card>

          <Card className="p-6 glass border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold gradient-accent bg-clip-text text-transparent">15</p>
              </div>
              <FileCheck className="w-8 h-8 text-warning" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tokenization Form */}
          <div className="lg:col-span-2">
            <Card className="p-8 glass border-border/50">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Coins className="w-6 h-6 mr-2 text-primary" />
                Tokenize New Product
              </h2>

              {isTokenizing ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center animate-glow-pulse">
                      <Coins className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Tokenizing Product...</h3>
                    <p className="text-muted-foreground">Creating your HTS token on Hedera network</p>
                  </div>
                  <Progress value={tokenizationProgress} className="w-full" />
                  <p className="text-center text-sm text-muted-foreground">
                    {tokenizationProgress}% Complete
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input id="productName" placeholder="e.g., Premium Cocoa Beans" />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity (kg)</Label>
                      <Input id="quantity" type="number" placeholder="1000" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price per kg (USD)</Label>
                      <Input id="price" type="number" placeholder="2.50" />
                    </div>
                    <div>
                      <Label htmlFor="origin">Country of Origin</Label>
                      <Input id="origin" placeholder="Ghana" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe your product, farming methods, certifications..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Product Images</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">Upload product images</p>
                      <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Certificates & Documentation</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <FileCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">Upload certificates, quality reports, etc.</p>
                      <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Documents
                      </Button>
                    </div>
                  </div>

                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    onClick={handleTokenize}
                  >
                    <Coins className="w-5 h-5 mr-2" />
                    Tokenize Product
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Products List */}
          <div>
            <Card className="p-6 glass border-border/50">
              <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
                Your Products
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </h3>

              <div className="space-y-4">
                {mockProducts.map((product) => (
                  <Card key={product.id} className="p-4 border border-border/30">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{product.name}</h4>
                      <Badge 
                        variant={product.status === "listed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {product.status}
                      </Badge>
                    </div>
                    
                    {product.tokenId && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Token ID: {product.tokenId}
                      </p>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span>${product.price}/kg</span>
                      <span>{product.quantity}kg</span>
                    </div>
                    
                    {product.orders > 0 && (
                      <p className="text-xs text-success mt-2">
                        {product.orders} active orders
                      </p>
                    )}

                    <Button variant="ghost" size="sm" className="w-full mt-3">
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProducerDashboard;
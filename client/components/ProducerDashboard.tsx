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
import { useRouter } from "next/navigation";
import ProducerAddProduct from "@/components/ProducerAddProduct";

const ProducerDashboard = () => {
  const router = useRouter();
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
                <p className="text-2xl font-bold ">12</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 glass border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold ">8</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </Card>

          <Card className="p-6 glass border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold ">$25,400</p>
              </div>
              <Coins className="w-8 h-8 text-accent" />
            </div>
          </Card>

          <Card className="p-6 glass border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold ">15</p>
              </div>
              <FileCheck className="w-8 h-8 text-warning" />
            </div>
          </Card>
        </div>
        
              <Button
                variant="glass"
                size="xl"
                onClick={() => router.push("/producer-add-product")}
              >
                Add New Product
              </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tokenization Form */}
          <div className="lg:col-span-2">
            
            <ProducerAddProduct />
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
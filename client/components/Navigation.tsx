import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Menu, X, Package, ShoppingCart, TrendingUp, User, Truck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation = ({ currentPage, onPageChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, walletAddress, isConnected, connectWallet, disconnectWallet, isLoading } = useAuth();

  const navItems = [
    { id: "home", label: "Home", icon: TrendingUp },
    { id: "marketplace", label: "Marketplace", icon: ShoppingCart },
    { id: "producer", label: "Producer", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "tracking", label: "Tracking", icon: Truck },
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleWalletAction = () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold">
              Hex-Port
            </span>
            <Badge variant="outline" className="hidden md:flex">
              Hedera Network
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-smooth",
                  currentPage === item.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected && user && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                </div>
                <Badge variant={user.verified ? "default" : "outline"} className="bg-success">
                  {user.verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            )}
            
            <Button
              variant={isConnected ? "accent" : "hero"}
              onClick={handleWalletAction}
              disabled={isLoading}
              className="hidden md:flex"
            >
              {isConnected ? <LogOut className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
              {isConnected 
                ? "Disconnect" 
                : isLoading 
                  ? "Connecting..." 
                  : "Connect Wallet"
              }
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-smooth",
                    currentPage === item.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
              
              {isConnected && user && (
                <div className="p-3 bg-muted/30 rounded-lg mb-3">
                  <div className="text-center">
                    <p className="font-medium">{user.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </p>
                    <Badge variant={user.verified ? "default" : "outline"} className="bg-success mt-1">
                      {user.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              )}
              
              <Button
                variant={isConnected ? "accent" : "hero"}
                onClick={handleWalletAction}
                disabled={isLoading}
                className="w-full"
              >
                {isConnected ? <LogOut className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                {isConnected 
                  ? "Disconnect" 
                  : isLoading 
                    ? "Connecting..." 
                    : "Connect Wallet"
                }
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
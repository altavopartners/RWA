"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Menu,
  X,
  Package,
  ShoppingCart,
  TrendingUp,
  User,
  Receipt,
  LogOut,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    walletAddress,
    isConnected,
    connectWallet,
    disconnectWallet,
    isLoading,
  } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: TrendingUp },
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/producer-dashboard", label: "Producer", icon: Package },
    { href: "/order-flow", label: "Orders", icon: Receipt },
    // { href: "/shipment-tracking", label: "Tracking",  icon: Truck },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (href: string) => pathname === href;

  const handleWalletAction = () =>
    isConnected ? disconnectWallet() : connectWallet();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold">
              Hex-Port
            </Link>
            <Badge variant="outline" className="hidden md:flex">
              Hedera Network
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-smooth",
                  isActive(href)
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}

            <Link
              href="/cart"
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-smooth relative",
                isActive("/cart")
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center bg-red-600">
                10
              </span>
            </Link>
          </div>

          {/* Wallet / Mobile Toggle */}
          <div className="flex items-center space-x-4">
            {isConnected && user && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {user.fullName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                </div>
                <Badge
                  variant={user.isVerified ? "default" : "outline"}
                  className={user.isVerified ? "bg-success" : ""}
                >
                  {user.isVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            )}

            <Button
              variant={isConnected ? "accent" : "hero"}
              onClick={handleWalletAction}
              disabled={isLoading}
              className="hidden md:flex"
            >
              {isConnected ? (
                <LogOut className="w-4 h-4" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              {isConnected
                ? "Disconnect"
                : isLoading
                ? "Connecting..."
                : "Connect Wallet"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="space-y-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <button
                  key={href}
                  onClick={() => {
                    router.push(href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-smooth",
                    isActive(href)
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}

              {isConnected && user && (
                <div className="p-3 bg-muted/30 rounded-lg mb-3 text-center">
                  <p className="font-medium">{user.fullName || "User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                  <Badge
                    variant={user.isVerified ? "default" : "outline"}
                    className="bg-success mt-1"
                  >
                    {user.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              )}

              <Button
                variant={isConnected ? "accent" : "hero"}
                onClick={handleWalletAction}
                disabled={isLoading}
                className="w-full"
              >
                {isConnected ? (
                  <LogOut className="w-4 h-4" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                {isConnected
                  ? "Disconnect"
                  : isLoading
                  ? "Connecting..."
                  : "Connect Wallet"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

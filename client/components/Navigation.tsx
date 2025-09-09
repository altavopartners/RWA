"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Menu, X, Package, ShoppingCart, TrendingUp, User, Truck, LogOut, Store, Receipt  } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const API_BASE = "http://localhost:4000";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, walletAddress, isConnected, connectWallet, disconnectWallet, isLoading } = useAuth();
  // ADDED
  const [count, setCount] = useState(0);

  // Map to your actual routes
  const navItems = [
    { href: "/",                 label: "Home",      icon: TrendingUp },
    { href: "/marketplace",      label: "Marketplace", icon: Store },
    { href: "/producer-dashboard", label: "Producer",   icon: Package },
    { href: "/order-flow",       label: "Orders",    icon: Receipt },
    { href: "/shipment-tracking", label: "Tracking",  icon: Truck },
    { href: "/profile",          label: "Profile",   icon: User }
  ];

  const isActive = (href: string) => {
    // strict match; tweak to startsWith if you add nested routes later
    return pathname === href;
  };

  const handleWalletAction = () => {
    if (isConnected) disconnectWallet();
    else connectWallet();
  };



  const fetchCartItemsCount = async () => {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

    const res = await fetch(`${API_BASE}/api/carts/getmycartcount`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // fine in the browser; prevents caching
      cache: "no-store",
    });

    // try JSON first; fall back to text
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      const txt = await res.text();
      if (!res.ok) throw new Error(txt || "Failed to fetch cart count");
      // if backend returns empty body but ok, treat as 0
      data = {};
    }

    if (!res.ok) {
      const message =
        (typeof data?.message === "string" && data.message) ||
        (typeof data?.error === "string" && data.error) ||
        "Failed to fetch cart count";
      throw new Error(message);
    }

    const nextCount = Number(data?.cartcount ?? 0);
    setCount(Number.isFinite(nextCount) ? nextCount : 0);
  } catch (err: any) {
    setCount(0);
  }
};

useEffect(() => {
  fetchCartItemsCount();
}, [pathname, isConnected]);


useEffect(() => {
  const handler = () => fetchCartItemsCount();
  window.addEventListener("cart:updated", handler);
  return () => window.removeEventListener("cart:updated", handler);
}, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold">
              Hex-Port
            </Link>
            <Badge variant="outline" className="hidden md:flex">Hedera Network</Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
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
              key="/cart"
              href="/cart"
              aria-current={isActive("/cart") ? "page" : undefined}
              className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg transition-smooth relative",
              isActive("/cart")
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
              )}
            >
              <ShoppingCart className="w-4 h-4" />
                <span
                  className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  style={{ background: "lab(56 6.99 -64.99)", minWidth: 20, minHeight: 20 }}
                >{count}
                </span>
            </Link>
          </div>

          {/* Wallet / Mobile toggle */}
          <div className="flex items-center space-x-4">
            {isConnected && user && (
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  {/* <p className="text-sm font-medium">{user.name || "User"}</p> */}
                  <p className="text-xs text-muted-foreground">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                </div>
                {/* <Badge variant={user.verified ? "default" : "outline"} className="bg-success">
                  {user.verified ? "Verified" : "Unverified"}
                </Badge> */}
              </div>
            )}

            <Button
              variant={isConnected ? "accent" : "hero"}
              onClick={handleWalletAction}
              disabled={isLoading}
              className="hidden md:flex"
            >
              {isConnected ? <LogOut className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
              {isConnected ? "Disconnect" : isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
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
                <div className="p-3 bg-muted/30 rounded-lg mb-3">
                  <div className="text-center">
                   {/* <p className="font-medium">{user.name || "User"}</p> */}
                    <p className="text-xs text-muted-foreground">
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </p>
                  {/*  <Badge variant={user.verified ? "default" : "outline"} className="bg-success mt-1">
                      {user.verified ? "Verified" : "Unverified"}
                    </Badge> */}
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
                {isConnected ? "Disconnect" : isLoading ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

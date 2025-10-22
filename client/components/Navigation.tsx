"use client";

import { useEffect, useState, useCallback } from "react";
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
  Truck,
  LogOut,
  Store,
  Receipt,
  Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const API_BASE = "http://localhost:4000";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Check if we're on the homepage
  const isHomePage = pathname === "/";

  const navItems = [
    { href: "/", label: "Home", icon: TrendingUp },
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/producer-add-product", label: "Add Product", icon: Package },
    { href: "/order-flow", label: "Orders", icon: Receipt },
    //{ href: "/shipment-tracking", label: "Tracking", icon: Truck },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (href: string) => pathname === href;

  const handleWalletAction = () =>
    isConnected ? disconnectWallet() : connectWallet();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCartItemsCount = useCallback(async () => {
    if (!isConnected || !user?.id) {
      setCount(0);
      return;
    }

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

      if (!token) {
        setCount(0);
        return;
      }

      const res = await fetch(`${API_BASE}/api/carts/getmycartcount`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        const txt = await res.text();
        if (!res.ok) throw new Error(txt || "Failed to fetch cart count");
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
    } catch {
      setCount(0);
    }
  }, [API_BASE, isConnected, user?.id]);

  useEffect(() => {
    if (isConnected && user?.id) {
      fetchCartItemsCount();
    } else {
      setCount(0);
    }
  }, [isConnected, user?.id, fetchCartItemsCount]);

  useEffect(() => {
    if (typeof window === "undefined" || !isConnected || !user?.id) return;
    const handler = () => fetchCartItemsCount();
    window.addEventListener("cart:updated", handler);
    return () => window.removeEventListener("cart:updated", handler);
  }, [fetchCartItemsCount, isConnected, user?.id]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-3">
      <div
        className={cn(
          "mx-auto transition-all duration-500",
          isScrolled
            ? "bg-white dark:bg-gray-900 shadow-2xl rounded-full border border-gray-100 dark:border-gray-800"
            : isHomePage
            ? ""
            : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm",
          // Adjust padding based on connection status
          isConnected ? "py-3" : isScrolled ? "py-2.5" : "py-3",
          // Dynamic max-width based on connection
          isConnected ? "max-w-[95%]" : "max-w-7xl"
        )}
      >
        <div className="px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Link href="/" className="flex items-center">
                <img src="/assets/hexportLogo.png" alt="Logo" className="h-14 w-auto" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg transition-smooth whitespace-nowrap",
                    isScrolled ? "text-base" : "text-sm",
                    isActive(href)
                      ? isScrolled
                        ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white"
                        : isHomePage
                        ? "bg-white/10 text-white"
                        : "bg-primary/20 text-primary"
                      : isScrolled
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
                      : isHomePage
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </Link>
              ))}

              <Link
                href="/cart"
                aria-current={isActive("/cart") ? "page" : undefined}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-smooth relative text-sm whitespace-nowrap",
                  isActive("/cart")
                    ? isScrolled
                      ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white"
                      : isHomePage
                      ? "bg-white/10 text-white"
                      : "bg-primary/20 text-primary"
                    : isScrolled
                    ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
                    : isHomePage
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                {isConnected && user?.id && count > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    style={{
                      minWidth: 20,
                      minHeight: 20,
                    }}
                    aria-label={`Cart items: ${count}`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </div>

            {/* Wallet / Mobile toggle */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {isConnected && user && (
                <div className="hidden lg:flex items-center space-x-3">
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-medium transition-colors",
                      isScrolled
                        ? "text-gray-900 dark:text-white"
                        : isHomePage
                        ? "text-white"
                        : "text-gray-900 dark:text-white"
                    )}>
                      {user?.fullName || "User"}
                    </p>
                    <p className={cn(
                      "text-xs transition-colors",
                      isScrolled
                        ? "text-gray-600 dark:text-white/70"
                        : isHomePage
                        ? "text-white/70"
                        : "text-gray-600 dark:text-gray-400"
                    )}>
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleWalletAction}
                disabled={isLoading}
                className={cn(
                  "hidden lg:flex whitespace-nowrap",
                  "bg-[#edf6f9] text-gray-900 hover:bg-[#d8edf2]",
                  "dark:bg-[#edf6f9] dark:text-gray-900 dark:hover:bg-[#d8edf2]"
                )}
                size="sm"
              >
                {isConnected ? (
                  <LogOut className="w-4 h-4 mr-2" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
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
                className={cn(
                  "lg:hidden transition-colors",
                  isScrolled
                    ? "text-gray-900 dark:text-white dark:hover:bg-white/10"
                    : isHomePage
                    ? "text-white hover:bg-white/10"
                    : "text-gray-900 dark:text-white"
                )}
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

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className={cn(
              "lg:hidden py-4 border-t animate-fade-in mt-4",
              isScrolled
                ? "border-gray-200 dark:border-white/10"
                : isHomePage
                ? "border-white/10"
                : "border-border/50"
            )}>
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
                        ? isScrolled
                          ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white"
                          : isHomePage
                          ? "bg-white/10 text-white"
                          : "bg-primary/20 text-primary"
                        : isScrolled
                        ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
                        : isHomePage
                        ? "text-white/80 hover:text-white hover:bg-white/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}

                <Link
                  href="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-smooth relative",
                    isActive("/cart")
                      ? isScrolled
                        ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white"
                        : isHomePage
                        ? "bg-white/10 text-white"
                        : "bg-primary/20 text-primary"
                      : isScrolled
                      ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
                      : isHomePage
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                  )}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart</span>
                  {isConnected && user?.id && count > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </Link>

                {isConnected && user && (
                  <div className={cn(
                    "p-3 rounded-lg mb-3 text-center",
                    isScrolled
                      ? "bg-gray-50 dark:bg-white/5"
                      : isHomePage
                      ? "bg-white/5"
                      : "bg-muted/30"
                  )}>
                    <p className={cn(
                      "font-medium",
                      isScrolled
                        ? "text-gray-900 dark:text-white"
                        : isHomePage
                        ? "text-white"
                        : ""
                    )}>{user?.fullName || "User"}</p>
                    <p className={cn(
                      "text-xs",
                      isScrolled
                        ? "text-gray-600 dark:text-white/70"
                        : isHomePage
                        ? "text-white/70"
                        : "text-muted-foreground"
                    )}>
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleWalletAction}
                  disabled={isLoading}
                  className="w-full bg-[#edf6f9] text-gray-900 hover:bg-[#d8edf2] dark:bg-[#edf6f9] dark:text-gray-900 dark:hover:bg-[#d8edf2]"
                >
                  {isConnected ? (
                    <LogOut className="w-4 h-4 mr-2" />
                  ) : (
                    <Wallet className="w-4 h-4 mr-2" />
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
      </div>
    </nav>
  );
}
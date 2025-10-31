"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Menu,
  X,
  Package,
  ShoppingCart,
  TrendingUp,
  User,
  LogOut,
  Store,
  Receipt
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

  // ✅ Pages that have a white background
  const whiteBgPages = ["/marketplace", "/profile", "/cart", "/order-flow"];
  const isWhiteBgPage = whiteBgPages.includes(pathname);

  const navItems = [
    { href: "/", label: "Home", icon: TrendingUp },
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/producer-add-product", label: "Add Product", icon: Package },
    { href: "/order-flow", label: "Orders", icon: Receipt },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (href: string) => pathname === href;

  const handleWalletAction = () =>
    isConnected ? disconnectWallet() : connectWallet();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cart count
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to fetch cart count");
      const nextCount = Number(data?.cartcount ?? 0);
      setCount(Number.isFinite(nextCount) ? nextCount : 0);
    } catch {
      setCount(0);
    }
  }, [API_BASE, isConnected, user?.id]);

  useEffect(() => {
    if (isConnected && user?.id) fetchCartItemsCount();
    else setCount(0);
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
            : "bg-transparent",
          isConnected ? "py-3" : isScrolled ? "py-2.5" : "py-3",
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
                    "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 whitespace-nowrap",
                    isScrolled ? "text-base" : "text-sm",
                    isActive(href)
                      ? "bg-white/10 text-gray-600 dark:text-white backdrop-blur-sm"
                      : isScrolled
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
                      : isWhiteBgPage
                      ? "text-gray-400 hover:text-gray-600 dark:text-white/80 dark:hover:text-white"
                      : "text-white dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 backdrop-blur-sm"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </Link>
              ))}

              {/* Cart */}
              <Link
                href="/cart"
                aria-current={isActive("/cart") ? "page" : undefined}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 relative text-sm whitespace-nowrap",
                  isActive("/cart")
                    ? "bg-white/10 text-gray-600 dark:text-white backdrop-blur-sm"
                    : isScrolled
                    ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
                    : isWhiteBgPage
                    ? "text-gray-400 hover:text-gray-600 dark:text-white/80 dark:hover:text-white"
                    : "text-white dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 backdrop-blur-sm"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                {isConnected && user?.id && count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#88CEDC] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Link>
            </div>

            {/* Wallet + User Info */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {isConnected && user && (
                <div className="hidden lg:flex items-center space-x-3">
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isScrolled
                          ? "text-gray-900 dark:text-white"
                          : isWhiteBgPage
                          ? "text-gray-400 dark:text-white"
                          : "text-white dark:text-white"
                      )}
                    >
                      {user?.fullName || "User"}
                    </p>
                    <p
                      className={cn(
                        "text-xs transition-colors",
                        isScrolled
                          ? "text-gray-600 dark:text-white/70"
                          : isWhiteBgPage
                          ? "text-gray-400 dark:text-white/70"
                          : "text-white dark:text-white/70"
                      )}
                    >
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleWalletAction}
                disabled={isLoading}
                className={cn(
                  "hidden lg:flex whitespace-nowrap transition-all duration-300",
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

              {/* Mobile Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "lg:hidden transition-colors",
                  isScrolled
                    ? "text-gray-900 dark:text-white dark:hover:bg-white/10"
                    : isWhiteBgPage
                    ? "text-gray-400 dark:text-white hover:text-gray-600"
                    : "text-white dark:text-white hover:bg-white/10"
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
        </div>
      </div>
    </nav>
  );
}

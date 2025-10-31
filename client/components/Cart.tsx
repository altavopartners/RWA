"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, RefreshCw, ShoppingCart, Sparkles, Package, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import Footer from "@/components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export type CartItem = {
  id: string | number;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

function money(n: number) {
  const formatted = new Intl.NumberFormat(undefined, {
    style: "decimal",
    maximumFractionDigits: 8,
  }).format(n);

  return (
    <span className="flex items-center gap-1.5">
      <span className="font-semibold">{formatted}</span>
      <span
        className="inline-block w-4 h-4 bg-contain bg-no-repeat flex-shrink-0"
        style={{ backgroundImage: `url(/assets/hbar_logo.png)` }}
      />
    </span>
  );
}

function joinUrl(base: string, path?: string | null) {
  if (!path) return undefined;
  try {
    if (/^https?:\/\//i.test(path)) return path;
    return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  } catch {
    return path || undefined;
  }
}

function CartContent() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const { isConnected } = useAuth();
  const router = useRouter();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

  const normalizeFromBackend = useCallback((raw: any): CartItem[] => {
    const rows: any[] =
      (Array.isArray(raw) && raw) ||
      (Array.isArray(raw?.items) && raw.items) ||
      (raw && typeof raw === "object" ? [raw] : []);

    return rows.map((row) => {
      const product = row.product || {};
      const id =
        row.id ??
        row._id ??
        row.itemId ??
        row.productId ??
        product.id ??
        product._id ??
        Math.random().toString(36).slice(2);

      const name =
        product.name ?? product.title ?? row.name ?? row.title ?? "Item";

      const price =
        Number(
          product.pricePerUnit ??
            product.price ??
            row.price ??
            row.unitPrice ??
            0
        ) || 0;

      const qty = Math.max(1, Number(row.quantity ?? row.qty ?? 1) || 1);

      const firstImagePath =
        row.image ??
        row.thumbnail ??
        product.image ??
        product.thumbnail ??
        (Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]?.path || product.images[0]?.url
          : undefined);

      const image = joinUrl(API_BASE, firstImagePath);

      return { id, name, price, qty, image } as CartItem;
    });
  }, []);

  const passOrder = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

      const res = await fetch(`${API_BASE}/api/orders/pass-order`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const txt = await res.text();
      let data: any = {};
      try {
        data = txt ? JSON.parse(txt) : {};
      } catch {
        if (!res.ok) throw new Error(txt || "Failed to pass order");
      }

      if (!res.ok) {
        const message =
          (typeof data?.message === "string" && data.message) ||
          (typeof data?.error === "string" && data.error) ||
          txt ||
          "Failed to pass order";
        throw new Error(message);
      }

      setItems([]);
      window.dispatchEvent(new Event("cart:updated"));
      router.push("/order-flow");
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, normalizeFromBackend, router]);

  const fetchCartItems = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/carts/getmycart`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const txt = await res.text();
      let data: any = {};
      try {
        data = txt ? JSON.parse(txt) : {};
      } catch {
        if (!res.ok) throw new Error(txt || "Failed to fetch cart items");
      }

      if (!res.ok) {
        const message =
          (typeof data?.message === "string" && data.message) ||
          (typeof data?.error === "string" && data.error) ||
          txt ||
          "Failed to fetch cart items";
        throw new Error(message);
      }

      const normalized = normalizeFromBackend(data);
      setItems(normalized);
      setLastFetchedAt(Date.now());
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, normalizeFromBackend, token]);

  useEffect(() => {
    if (isConnected) fetchCartItems();
  }, [isConnected, fetchCartItems]);

  const inc = useCallback(async (id: CartItem["id"]) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it))
    );
    await fetch(`${API_BASE}/api/carts/incrementitemquantity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ cartItemId: id }),
    });
    window.dispatchEvent(new Event("cart:updated"));
  }, [token]);

  const dec = useCallback(async (id: CartItem["id"]) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it
      )
    );
    await fetch(`${API_BASE}/api/carts/decrementitemquantity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ cartItemId: id }),
    });
    window.dispatchEvent(new Event("cart:updated"));
  }, [token]);

  const removeItem = useCallback(async (id: CartItem["id"]) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    await fetch(`${API_BASE}/api/carts/removeitemfromcart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ cartItemId: id }),
    });
    window.dispatchEvent(new Event("cart:updated"));
  }, [token]);

  const { subtotal, shipping, fees, total } = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const shipping = items.length > 0 ? 5 : 0;
    const fees = (subtotal + shipping) * 0.05;
    const total = subtotal + shipping + fees;
    return { subtotal, shipping, fees, total };
  }, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 -mt-16">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#486C7A] via-[#265663] to-[#0C171B] pt-45 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#88CEDC] rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-white rounded-full blur-3xl" />
        </div>

        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10 container mx-auto px-6 text-center">
         
          <h1 className="pd-30 text-5xl md:text-6xl font-bold mb-6 text-white leading-tight" style={{ color: '#edf6f9' }}>
            Your Cart
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            {items.length} {items.length === 1 ? 'item' : 'items'} ready for checkout
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-12 relative z-20 pb-20">
        <div className="flex items-center justify-end mb-6">
          <Button 
            variant="outline" 
            onClick={fetchCartItems} 
            disabled={loading}
            className="rounded-2xl hover:bg-[#88CEDC]/10 hover:border-[#88CEDC]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <Card className="p-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 text-center">
                <div className="inline-block w-12 h-12 border-4 border-[#88CEDC] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading your cart...</p>
              </Card>
            ) : error ? (
              <Card className="p-8 bg-red-50/80 dark:bg-red-950/20 backdrop-blur-xl border-red-200/50 dark:border-red-900/50">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </Card>
            ) : items.length === 0 ? (
              <Card className="p-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Add some amazing products to get started!</p>
                <Button 
                  onClick={() => router.push('/marketplace')}
                  className="bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white rounded-2xl"
                >
                  Browse Marketplace
                </Button>
              </Card>
            ) : (
              <>
                {items.map((it, index) => (
                  <Card
                    key={it.id}
                    className="overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 hover:shadow-xl transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        {/* Image */}
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex-shrink-0 group">
                          {it.image ? (
                            <img
                              src={it.image}
                              alt={it.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate">
                            {it.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Unit Price:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{money(it.price)}</span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-2xl p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => dec(it.id)}
                            className="hover:bg-white dark:hover:bg-gray-700 rounded-xl"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="w-12 text-center font-bold text-gray-900 dark:text-white tabular-nums">
                            {it.qty}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => inc(it.id)}
                            className="hover:bg-white dark:hover:bg-gray-700 rounded-xl"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right min-w-[120px]">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subtotal</div>
                          <div className="font-bold text-xl bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
                            {money(it.price * it.qty)}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(it.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl flex-shrink-0"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {lastFetchedAt && (
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                    Last updated: {new Date(lastFetchedAt).toLocaleTimeString()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{money(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{money(shipping)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Processing Fee (5%)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{money(fees)}</span>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent my-4" />

                <div className="flex items-center justify-between text-xl">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
                    {money(total)}
                  </span>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <Button
                  className="relative w-full bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white font-bold py-6 rounded-2xl shadow-lg"
                  disabled={items.length === 0 || loading}
                  onClick={passOrder}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Confirm Order
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 p-4 bg-[#88CEDC]/10 rounded-2xl border border-[#88CEDC]/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#88CEDC]/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[#88CEDC]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Secure Checkout</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your payment is protected by hedera-backed escrow
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CartPage() {
  const { isConnected } = useAuth();
  const { triggerConnect } = useWalletConnect();

  useEffect(() => {
    if (!isConnected) {
      triggerConnect();
    }
  }, [isConnected, triggerConnect]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 -mt-16">
        <div className="relative bg-gradient-to-br from-[#486C7A] via-[#265663] to-[#0C171B] pt-32 pb-20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#88CEDC] rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 container mx-auto px-6 pt-12">
            <Card className="p-12 text-center max-w-md mx-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xl">
              <div className="w-20 h-20 bg-[#88CEDC]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-[#88CEDC]" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Cart Access Required</h2>
              <p className="text-muted-foreground mb-6">Please connect your wallet to view your cart.</p>
              <Button onClick={triggerConnect} className="bg-[#88CEDC] hover:bg-[#7BC0CF] text-white">
                Connect Wallet
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return <CartContent />;
}
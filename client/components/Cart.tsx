"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useWalletConnect } from "@/hooks/useWalletConnect";

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
    <span className="flex items-center gap-1">
      <span style={{ fontWeight: "normal" }}>{formatted}</span>
      <span
        className="inline-block w-4 h-4 bg-contain bg-no-repeat flex-shrink-0"
        style={{ backgroundImage: `url(/assets/hbar_logo.png)` }}
      />
      <span style={{ fontWeight: "normal" }}>BAR</span>
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

  const normalizeFromBackend = useCallback((raw: unknown): CartItem[] => {
    let rows: unknown[] = [];

    if (Array.isArray(raw)) {
      rows = raw;
    } else if (
      raw &&
      typeof raw === "object" &&
      "items" in raw &&
      Array.isArray(raw.items)
    ) {
      rows = raw.items;
    } else if (raw && typeof raw === "object") {
      rows = [raw];
    }

    return rows.map((row: unknown) => {
      const rowObj =
        row && typeof row === "object" ? (row as Record<string, unknown>) : {};
      const product =
        "product" in rowObj && typeof rowObj.product === "object"
          ? (rowObj.product as Record<string, unknown>)
          : {};

      const id =
        (rowObj.id as string) ??
        (rowObj._id as string) ??
        (rowObj.itemId as string) ??
        (rowObj.productId as string) ??
        (product.id as string) ??
        (product._id as string) ??
        Math.random().toString(36).slice(2);

      const name =
        (product.name as string) ??
        (product.title as string) ??
        (rowObj.name as string) ??
        (rowObj.title as string) ??
        "Item";

      const price =
        Number(
          (product.pricePerUnit as number) ??
            (product.price as number) ??
            (rowObj.price as number) ??
            (rowObj.unitPrice as number) ??
            0
        ) || 0;

      const qty = Math.max(
        1,
        Number((rowObj.quantity as number) ?? (rowObj.qty as number) ?? 1) || 1
      );

      const productImages = Array.isArray(product.images) ? product.images : [];
      const firstImagePath =
        (rowObj.image as string) ??
        (rowObj.thumbnail as string) ??
        (product.image as string) ??
        (product.thumbnail as string) ??
        (productImages.length > 0
          ? ((productImages[0] as Record<string, unknown>)?.path as string) ||
            ((productImages[0] as Record<string, unknown>)?.url as string)
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
      let data: unknown = {};
      try {
        data = txt ? JSON.parse(txt) : {};
      } catch {
        if (!res.ok) throw new Error(txt || "Failed to pass order");
      }

      if (!res.ok) {
        const message: string =
          (data &&
          typeof data === "object" &&
          "message" in data &&
          typeof data.message === "string"
            ? data.message
            : "") ||
          (data &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "") ||
          txt ||
          "Failed to pass order";
        throw new Error(message);
      }

      // Verify escrow was deployed
      const order = data && typeof data === "object" ? (data as any) : {};
      const escrowAddress =
        order.escrowAddress || (order.order && order.order.escrowAddress);

      if (!escrowAddress) {
        // Order created but escrow contract not deployed yet. Waiting 2 seconds and retrying...
        // Wait a bit and retry once
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Fetch the order to check if escrow deployed
        if (order.id || (order.order && order.order.id)) {
          const orderId = order.id || order.order.id;
          const checkRes = await fetch(
            `${API_BASE}/api/orders/get-my-order/${orderId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              cache: "no-store",
            }
          );

          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (
              !checkData.escrowAddress &&
              !(checkData.order && checkData.order.escrowAddress)
            ) {
              // Escrow still not deployed. Proceeding anyway - can pay once it deploys.
            }
          }
        }
      } else {
        // Escrow contract deployed successfully
      }

      setItems([]);
      window.dispatchEvent(new Event("cart:updated"));
      router.push("/order-flow");
    } catch (e: unknown) {
      console.error("❌ Order error:", e);
      setError(e instanceof Error ? e.message : "Something went wrong");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, router]);

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
      let data: unknown = {};
      try {
        data = txt ? JSON.parse(txt) : {};
      } catch {
        if (!res.ok) throw new Error(txt || "Failed to fetch cart items");
      }

      if (!res.ok) {
        const message: string =
          (data &&
          typeof data === "object" &&
          "message" in data &&
          typeof data.message === "string"
            ? data.message
            : "") ||
          (data &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "") ||
          txt ||
          "Failed to fetch cart items";
        throw new Error(message);
      }

      const normalized = normalizeFromBackend(data);
      setItems(normalized);
      setLastFetchedAt(Date.now());
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Something went wrong");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, normalizeFromBackend, token]);

  useEffect(() => {
    if (isConnected) fetchCartItems();
  }, [isConnected, fetchCartItems]);

  const inc = useCallback(
    async (id: CartItem["id"]) => {
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
    },
    [token]
  );

  const dec = useCallback(
    async (id: CartItem["id"]) => {
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
    },
    [token]
  );

  const removeItem = useCallback(
    async (id: CartItem["id"]) => {
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
    },
    [token]
  );

  const { subtotal, shipping, fees, total } = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const shipping = items.length > 0 ? 5 : 0;
    const fees = (subtotal + shipping) * 0.05; // 5% fees
    const total = subtotal + shipping + fees;
    return { subtotal, shipping, fees, total };
  }, [items]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <Button variant="outline" onClick={fetchCartItems} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <p className="text-muted-foreground">Loading your cart…</p>
            ) : error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="space-y-3">
                <p className="text-muted-foreground">Your cart is empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.image || "/placeholder.svg"}
                      alt={it.name}
                      className="h-16 w-16 rounded-lg object-cover border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {money(it.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => dec(it.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-10 text-center tabular-nums">
                        {it.qty}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => inc(it.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-24 text-right font-medium">
                      {money(it.price * it.qty)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove item"
                      onClick={() => removeItem(it.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
                {lastFetchedAt && (
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(lastFetchedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">
                {money(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium tabular-nums">
                {money(shipping)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fees (5%)</span>
              <span className="font-medium tabular-nums">{money(fees)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold tabular-nums">{money(total)}</span>
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={items.length === 0 || loading}
              onClick={passOrder}
            >
              Confirm Order
            </Button>
          </CardContent>
        </Card>
      </div>
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
      <div className="max-w-5xl mx-auto p-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Cart Access Required</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to view your cart.
          </p>
        </Card>
      </div>
    );
  }

  return <CartContent />;
}

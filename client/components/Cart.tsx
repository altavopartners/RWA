// app/cart/page.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus } from "lucide-react";

// Super simple, client-only cart page – no fetching, no taxonomy, no SEO.
// Replace the initialItems with your data source if/when you wire this up.

type CartItem = {
  id: string | number;
  name: string;
  price: number; // unit price in USD (or your currency)
  qty: number;
  image?: string;
};

const initialItems: CartItem[] = [
  { id: 1, name: "Sample Product A", price: 19.99, qty: 1, image: "/placeholder.svg" },
  { id: 2, name: "Sample Product B", price: 9.5, qty: 2, image: "/placeholder.svg" },
];

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

export default function CartPage() {
  const [items, setItems] = React.useState<CartItem[]>(initialItems);

  function inc(id: CartItem["id"]) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)));
  }
  function dec(id: CartItem["id"]) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it))
    );
  }
  function removeItem(id: CartItem["id"]) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const shipping = items.length > 0 ? 5 : 0; // flat example shipping
  const total = subtotal + shipping;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4 sm:p-6">
            {items.length === 0 ? (
              <p className="text-muted-foreground">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-4 p-3 rounded-xl border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.image || "/placeholder.svg"}
                      alt={it.name}
                      className="h-16 w-16 rounded-lg object-cover border"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-sm text-muted-foreground">{money(it.price)}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => dec(it.id)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-10 text-center tabular-nums">{it.qty}</div>
                      <Button variant="outline" size="icon" onClick={() => inc(it.id)}>
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">{money(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium tabular-nums">{money(shipping)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold tabular-nums">{money(total)}</span>
            </div>
            <Button className="w-full" disabled={items.length === 0}>
              Checkout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tiny helpers for developers – safe to delete */}
      <div className="text-xs text-muted-foreground">
        Replace state with your store (Zustand/Context/Redux) or server actions.
      </div>
    </div>
  );
}
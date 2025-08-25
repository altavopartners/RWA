"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2, Minus, Plus, X, Package } from "lucide-react";

type Unit = "kg" | "ct";

type AddToCartPopupProps = {
  product: {
    id: string;
    name: string;
    pricePerUnit: number;
    unit: Unit;
    minOrder: number;
    available: number;
  };
  onConfirm?: (qty: number) => Promise<void> | void;
  triggerClassName?: string;
};

export default function AddToCartPopup({
  product,
  onConfirm,
  triggerClassName,
}: AddToCartPopupProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // <-- for portal (avoids SSR mismatch)
  const [qty, setQty] = useState(product.minOrder);
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  const total = useMemo(
    () => qty * product.pricePerUnit,
    [qty, product.pricePerUnit]
  );

  // ESC + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dec = () => setQty((q) => Math.max(product.minOrder, q - 1));
  const inc = () => setQty((q) => Math.min(product.available, q + 1));
  const onInput = (v: string) => {
    const n = Number(v);
    if (Number.isNaN(n)) return;
    setQty(Math.max(product.minOrder, Math.min(product.available, n)));
  };

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm?.(qty);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // -------- overlay UI (portaled) --------
  const overlay = (
    <div
      className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm
                 flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
      aria-hidden={!open}
    >
      <Card
        className="w-full max-w-md p-8 glass border-border/50"
        onClick={(e) => e.stopPropagation()} // keep clicks inside
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-cart-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <Package className="w-4 h-4 text-primary" />
              </span>
              <h3 id="add-to-cart-title" className="text-xl font-semibold">
                {product.name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ${product.pricePerUnit.toLocaleString()}/{product.unit}
            </p>
            <p className="text-xs text-muted-foreground">
              Available: {product.available} {product.unit} • Min: {product.minOrder} {product.unit}
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose quantity</label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={dec} disabled={qty <= product.minOrder}>
                <Minus className="w-4 h-4" />
              </Button>

              <input
                type="number"
                inputMode="numeric"
                min={product.minOrder}
                max={product.available}
                step={1}
                value={qty}
                onChange={(e) => onInput(e.target.value)}
                className="w-28 h-10 rounded-md border bg-background px-3"
                autoFocus
              />

              <Button variant="outline" size="icon" onClick={inc} disabled={qty >= product.available}>
                <Plus className="w-4 h-4" />
              </Button>

              <Badge variant="secondary">{product.unit}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Min order {product.minOrder} {product.unit}. You can order up to {product.available} {product.unit}.
            </p>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-semibold">${total.toLocaleString()}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={confirm}
              disabled={saving || qty < product.minOrder || qty > product.available}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add {qty} {product.unit}
                </>
              )}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>

          <div className="pt-2 border-t border-border/50">
            <Badge variant="outline" className="glass">
              Incoterms & shipping calculated at checkout
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <Button onClick={() => setOpen(true)} 
                      variant="hero" 
                      className="flex-1 cursor-pointer">
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to cart
      </Button>

      {open && mounted && createPortal(overlay, document.body)}
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2, Minus, Plus, X, Package } from "lucide-react";
import { addItemToCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { useAuthAction } from "@/components/auth-guard";

type Unit = "kg" | "ct";

type AddToCartPopupProps = {
  product: any;
  onConfirm?: (qty: number) => Promise<void> | void;
  triggerClassName?: string;
};

export default function AddToCartPopup({
  product,
  onConfirm,
  triggerClassName,
}: AddToCartPopupProps) {
  const { toast } = useToast();
  const { requireAuth } = useAuthAction();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const minOrder = useMemo(() => {
    const raw = Number(product?.minOrder ?? product?.minOrderQty ?? 1);
    return Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 1;
  }, [product?.minOrder, product?.minOrderQty]);

  const available = useMemo(() => {
    const raw = Number(product?.available ?? product?.quantity ?? 0);
    return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  }, [product?.available, product?.quantity]);

  const unit: string = product?.unit ?? "unit";

  const [qty, setQty] = useState(() =>
    Math.max(
      1,
      Math.min(
        available,
        Math.floor(Number(product?.minOrder ?? product?.minOrderQty ?? 1))
      )
    )
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(available, Math.floor(Number(q) || 1))));
  }, [available]);

  const total = useMemo(
    () => (Number(qty) || 0) * (Number(product?.pricePerUnit) || 0),
    [qty, product?.pricePerUnit]
  );

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

  const dec = () => setQty((q: number) => Math.max(1, Math.floor(q) - 1));
  const inc = () =>
    setQty((q: number) => Math.min(available, Math.floor(q) + 1));

  const onInput = (v: string) => {
    const n = Number(v);
    if (Number.isNaN(n)) return;
    setQty(Math.max(1, Math.min(available, Math.floor(n))));
  };

  const confirm = async () => {
    setSaving(true);
    try {
      const resp = await addItemToCart(
        { idofproduct: product.id, qty },
        { useCookieAuth: true }
      );

      if (!resp.success) {
        console.error("Add failed:", resp.message);
        return;
      }

      window.dispatchEvent(new Event("cart:updated"));
      toast({
        title: "Item added to cart",
        description: "Successfully added the item to your cart!",
        variant: "default",
      });

      setOpen(false);
    } catch (err) {
      console.error("Network/API error", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = () => {
    requireAuth(() => setOpen(true));
  };

  const outOfStock = available <= 0;

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm
                 flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
      aria-hidden={!open}
    >
      <Card
        className="w-full max-w-md p-8 glass border-border/50"
        onClick={(e) => e.stopPropagation()}
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
                {product?.name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ${Number(product?.pricePerUnit || 0).toLocaleString()}/{unit}
            </p>
            <p className="text-xs text-muted-foreground">
              Available: {available.toLocaleString()} {unit} • Min:{" "}
              {minOrder.toLocaleString()} {unit}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose quantity</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={dec}
                disabled={outOfStock || qty <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>

              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={available}
                step={1}
                value={qty}
                onChange={(e) => onInput(e.target.value)}
                className="w-28 h-10 rounded-md border border-border bg-background px-3 text-foreground"
                autoFocus
              />

              <Button
                variant="outline"
                size="icon"
                onClick={inc}
                disabled={outOfStock || qty >= available}
              >
                <Plus className="w-4 h-4" />
              </Button>

              <Badge variant="secondary">{unit}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Min order {minOrder.toLocaleString()} {unit}. You can order up to{" "}
              {available.toLocaleString()} {unit}. The Add button will enable
              once your quantity meets the minimum.
            </p>
            {outOfStock && (
              <p className="text-xs text-destructive">
                Not enough stock available right now.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-semibold">
              ${total.toLocaleString()}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-success text-success-foreground hover:bg-success/90 cursor-pointer"
              onClick={confirm}
              disabled={
                saving || outOfStock || qty < minOrder || qty > available
              }
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add {qty} {unit}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setOpen(false)}
            >
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
      <Button
        onClick={handleAddToCart}
        variant="default"
        className={`flex-1 cursor-pointer ${triggerClassName ?? ""}`}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to cart ?
      </Button>

      {open && mounted && createPortal(overlay, document.body)}
    </>
  );
}

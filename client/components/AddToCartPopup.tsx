"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2, Minus, Plus, X, Package, CheckCircle2, AlertCircle } from "lucide-react";
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
  const meetsMinOrder = qty >= minOrder;
  const withinStock = qty <= available;
  const canAdd = !outOfStock && meetsMinOrder && withinStock;

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md
                 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
      aria-hidden={!open}
    >
      <Card
        className="w-full max-w-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 
                   shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-cart-title"
      >
        {/* Header */}
        <div className="relative p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 id="add-to-cart-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                {product?.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Add to your cart
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white 
                        hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Price & Stock Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Price per {unit}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Number(product?.pricePerUnit || 0).toLocaleString()} HBAR
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Available Stock
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {available.toLocaleString()} <span className="text-base font-normal text-gray-500">{unit}</span>
              </p>
            </div>
          </div>

          {/* Min Order Alert */}
          {minOrder > 1 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Minimum order requirement
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  This product requires a minimum order of {minOrder.toLocaleString()} {unit}
                </p>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              Select Quantity
            </label>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={dec}
                disabled={outOfStock || qty <= 1}
                className="w-12 h-12 rounded-xl border-2 hover:border-[#88CEDC] hover:bg-[#88CEDC]/10 
                          transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5" />
              </Button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={available}
                  step={1}
                  value={qty}
                  onChange={(e) => onInput(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 
                            bg-white dark:bg-gray-800 px-4 text-center text-lg font-bold
                            text-gray-900 dark:text-white
                            focus:border-[#88CEDC] focus:ring-2 focus:ring-[#88CEDC]/20 
                            transition-all outline-none"
                  autoFocus
                />
                <Badge 
                  variant="secondary" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 dark:bg-gray-700"
                >
                  {unit}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={inc}
                disabled={outOfStock || qty >= available}
                className="w-12 h-12 rounded-xl border-2 hover:border-[#88CEDC] hover:bg-[#88CEDC]/10 
                          transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Validation Messages */}
            {!outOfStock && (
              <div className="flex items-center gap-2 text-xs">
                {meetsMinOrder ? (
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Meets minimum order</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Need {minOrder - qty} more {unit} to meet minimum</span>
                  </div>
                )}
              </div>
            )}

            {outOfStock && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Out of stock
                </p>
              </div>
            )}
          </div>

          {/* Total Section */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 
                          dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-sm text-gray-900 dark:text-white font-medium">
                {qty} × {Number(product?.pricePerUnit || 0).toLocaleString()} HBAR
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-base font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="text-2xl font-bold text-[#88CEDC]">
                {total.toLocaleString()} HBAR
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 h-12 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] 
                        hover:from-[#7BC0CF] hover:to-[#4A97A7]
                        text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                        transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={confirm}
              disabled={saving || !canAdd}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                  Adding to cart...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" /> 
                  Add {qty} {unit} to Cart
                </>
              )}
            </Button>
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Package className="w-3.5 h-3.5" />
              <span>Shipping costs and incoterms will be calculated at checkout</span>
            </div>
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
        className={`flex-1 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] 
                   hover:from-[#7BC0CF] hover:to-[#4A97A7]
                   text-white font-semibold shadow-md hover:shadow-lg 
                   transition-all disabled:opacity-50 disabled:cursor-not-allowed
                   ${triggerClassName ?? ""}`}
        disabled={outOfStock}
      >
        {outOfStock ? (
          <>
            <AlertCircle className="w-4 h-4 mr-2" />
            Out of Stock
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </>
        )}
      </Button>

      {open && mounted && createPortal(overlay, document.body)}
    </>
  );
}
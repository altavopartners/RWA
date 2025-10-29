// components/ProductDetails.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, AlertTriangle } from "lucide-react";
import { constructApiUrl, constructImageUrl } from "@/config/api";

type Product = {
  id: string | number;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  countryOfOrigin: string;
  category?: string;
  subcategory?: string;
  description: string;
  hsCode?: string;
  incoterm?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  images?: Array<{ path: string; originalName?: string }>;
  documents?: Array<{ path: string; originalName?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

function fmtMoney(n?: number) {
  if (typeof n !== "number" || Number.isNaN(n)) {
    return <span>-</span>;
  }

  const formatted = new Intl.NumberFormat(undefined, {
    style: "decimal",
    maximumFractionDigits: 8, // HBAR supports up to 8 decimals
  }).format(n);

  return (
    <span className="flex items-center gap-1">
      <span style={{ fontWeight: "normal" }}>{formatted}</span>
      <span
        className="inline-block w-4 h-4 bg-contain bg-no-repeat"
        style={{ backgroundImage: `url(/assets/hbar_logo.png)` }}
      />
      <span style={{ fontWeight: "normal" }}>BAR</span>
    </span>
  );
}

function listifyMedia<T extends { path: string; originalName?: string }>(
  arr?: T[]
) {
  if (!arr || arr.length === 0) return [];
  return arr.map((f) => ({
    url: constructImageUrl(f.path),
    name: f.originalName ?? f.path.split("/").pop(),
  }));
}

export default function ProductDetails({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(constructApiUrl(`/api/products/${id}`));
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data = (await res.json()) as Product;
        if (!cancelled) setProduct(data);
      } catch (e: unknown) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ✅ Hooks always called, even if product is null
  const imgs = useMemo(() => listifyMedia(product?.images), [product?.images]);
  const docs = useMemo(
    () => listifyMedia(product?.documents),
    [product?.documents]
  );

  if (loading) return <p className="p-6">Loading…</p>;

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Couldn’t load product</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card className="p-8 glass border-border/50">
        {/* title + badges */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold flex items-center">
            <Coins className="w-7 h-7 mr-2 text-primary" />
            {product.name}
          </h1>
          <div className="flex gap-2">
            {product.category && (
              <Badge variant="secondary">{product.category}</Badge>
            )}
            {product.subcategory && (
              <Badge variant="outline">{product.subcategory}</Badge>
            )}
          </div>
        </div>

        <p className="mt-3 text-muted-foreground">{product.description}</p>

        {/* Images */}
        {imgs.length > 0 && (
          <>
            <Separator className="my-6" />
            <h2 className="text-lg font-semibold mb-3">Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {imgs.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative rounded-lg overflow-hidden border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt={f.name || `image-${i}`}
                    className="aspect-video object-cover w-full h-full"
                  />
                </a>
              ))}
            </div>
          </>
        )}

        <Separator className="my-6" />

        {/* Core info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Quantity</div>
            <div className="text-base font-medium">
              {product.quantity} {product.unit}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Price / Unit</div>
            <div className="text-base font-medium">
              {fmtMoney(product.pricePerUnit)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              Country of Origin
            </div>
            <div className="text-base font-medium">
              {product.countryOfOrigin}
            </div>
          </div>
        </div>

        {/* Extra fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <div className="text-sm text-muted-foreground">HS Code</div>
            <div className="text-base font-medium">{product.hsCode || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Incoterm</div>
            <div className="text-base font-medium">
              {product.incoterm || "-"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Min Order Qty</div>
            <div className="text-base font-medium">
              {typeof product.minOrderQty === "number"
                ? product.minOrderQty
                : "-"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <div className="text-sm text-muted-foreground">
              Lead Time (days)
            </div>
            <div className="text-base font-medium">
              {typeof product.leadTimeDays === "number"
                ? product.leadTimeDays
                : "-"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Product ID</div>
            <div className="text-base font-medium">#{product.id}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Updated</div>
            <div className="text-base font-medium">
              {product.updatedAt
                ? new Date(product.updatedAt).toLocaleString()
                : product.createdAt
                ? new Date(product.createdAt).toLocaleString()
                : "-"}
            </div>
          </div>
        </div>

        {/* Documents */}
        {docs.length > 0 && (
          <>
            <Separator className="my-6" />
            <h2 className="text-lg font-semibold mb-3">
              Certificates & Documents
            </h2>
            <ul className="space-y-2">
              {docs.map((d, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="truncate">{d.name}</span>
                  <a
                    className="underline text-sm"
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}

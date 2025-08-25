// app/product/[id]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, AlertTriangle } from "lucide-react";

// --- keep your taxonomy in sync with the creator form ---
const categories = [
  { id: "agri", label: "Agricultural Products" },
  { id: "raw", label: "Raw Materials" },
  { id: "processed", label: "Processed Goods" },
  { id: "manufactured", label: "Manufactured Items" },
] as const;

const subcategories: Record<string, { id: string; label: string }[]> = {
  agri: [
    { id: "coffee", label: "Coffee Beans" },
    { id: "cocoa", label: "Cocoa Beans" },
    { id: "tea", label: "Tea Leaves" },
    { id: "fruits", label: "Fruits & Vegetables" },
    { id: "nuts-oilseeds", label: "Nuts & Oilseeds" },
    { id: "spices", label: "Spices" },
  ],
  raw: [
    { id: "crude-oil", label: "Crude Oil" },
    { id: "natural-gas", label: "Natural Gas" },
    { id: "gold", label: "Gold" },
    { id: "diamonds", label: "Diamonds" },
    { id: "copper", label: "Copper" },
    { id: "iron-ore", label: "Iron Ore" },
  ],
  processed: [
    { id: "edible-oils", label: "Edible Oils" },
    { id: "cocoa-products", label: "Cocoa Products" },
    { id: "roasted-coffee-tea", label: "Roasted Coffee & Tea" },
    { id: "refined-sugar", label: "Refined Sugar" },
    { id: "processed-fruits", label: "Processed Fruits" },
    { id: "leather-tanned", label: "Leather (Tanned)" },
    { id: "textile-yarn", label: "Textile Yarn & Fabrics" },
  ],
  manufactured: [
    { id: "textiles-apparel", label: "Textiles & Apparel" },
    { id: "footwear", label: "Footwear & Leather Goods" },
    { id: "vehicles", label: "Vehicles & Parts" },
    { id: "machinery", label: "Machinery & Equipment" },
    { id: "electronics", label: "Electrical Equipment" },
    { id: "building-materials", label: "Building Materials" },
  ],
};

// --- types (aligns with what your creator form posts) ---
type Product = {
  id: string | number;
  name: string;
  quantity: number;
  unit: "kg" | "ton" | "piece" | "litre";
  pricePerUnit: number;
  countryOfOrigin: string;
  category?: (typeof categories)[number]["id"];
  subcategory?: string;
  description: string;
  hsCode?: string;
  incoterm?: "FOB" | "CIF" | "EXW" | "DAP";
  minOrderQty?: number;
  leadTimeDays?: number;
  // your API should ideally return file URLs; handle both strings & objects defensively:
  images?: Array<string | { url: string }>;
  documents?: Array<string | { url: string; name?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

export const dynamic = "force-dynamic"; // always fetch fresh in dev

// Optional SEO
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = params.id;
  try {
    const res = await fetch(`http://localhost:4000/api/products/${id}`, {
      // If your API requires cookies/headers, add them here.
      // cache: "no-store" // alternative to dynamic
      next: { revalidate: 0 },
    });

    if (!res.ok) return { title: `Product ${id}` };
    const p: Product = await res.json();
    return {
      title: `${p.name} · Product #${id}`,
      description: p.description?.slice(0, 160),
    };
  } catch {
    return { title: `Product ${id}` };
  }
}

function fmtMoney(n?: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return "-";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function catLabel(cat?: string) {
  if (!cat) return "-";
  const c = categories.find((x) => x.id === cat);
  return c?.label ?? cat;
}

function subcatLabel(cat?: string, sub?: string) {
  if (!cat || !sub) return "-";
  const s = subcategories[cat]?.find((x) => x.id === sub);
  return s?.label ?? sub;
}

function listifyMedia(arr?: Array<string | { url: string; name?: string }>) {
  if (!arr || arr.length === 0) return [];
  return arr
    .map((x) => (typeof x === "string" ? { url: x, name: x.split("/").pop() || "file" } : x))
    .filter((x) => !!x?.url);
}
export default async function ProductDetails({ id }: { id: string }) {

  let product: Product | null = null;
  let fatalError: string | null = null;

  try {
    const res = await fetch(`http://localhost:4000/api/products/${id}`, {
      next: { revalidate: 0 },
    });

    if (res.status === 404) return notFound();
    if (!res.ok) {
      fatalError = `Server responded with ${res.status}`;
    } else {
      product = (await res.json()) as Product;
    }
  } catch (e: any) {
    fatalError = e?.message ?? "Failed to fetch product.";
  }

  if (fatalError) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Couldn’t load product</AlertTitle>
          <AlertDescription>{fatalError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) return null;

  const imgs = listifyMedia(product.images);
  const docs = listifyMedia(product.documents);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card className="p-8 glass border-border/50">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold flex items-center">
            <Coins className="w-7 h-7 mr-2 text-primary" />
            {product.name}
          </h1>
          <div className="flex gap-2">
            {product.category && (
              <Badge variant="secondary">{catLabel(product.category)}</Badge>
            )}
            {product.subcategory && product.category && (
              <Badge variant="outline">{subcatLabel(product.category, product.subcategory)}</Badge>
            )}
          </div>
        </div>

        <p className="mt-3 text-muted-foreground">{product.description}</p>

        {/* Media */}
        {imgs.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
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
            </div>
          </>
        )}

        <Separator className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Quantity</div>
            <div className="text-base font-medium">
              {product.quantity} {product.unit}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Price / Unit</div>
            <div className="text-base font-medium">{fmtMoney(product.pricePerUnit)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Country of Origin</div>
            <div className="text-base font-medium">{product.countryOfOrigin}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <div className="text-sm text-muted-foreground">HS Code</div>
            <div className="text-base font-medium">{product.hsCode || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Incoterm</div>
            <div className="text-base font-medium">{product.incoterm || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Min Order Qty</div>
            <div className="text-base font-medium">
              {typeof product.minOrderQty === "number" ? product.minOrderQty : "-"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <div className="text-sm text-muted-foreground">Lead Time (days)</div>
            <div className="text-base font-medium">
              {typeof product.leadTimeDays === "number" ? product.leadTimeDays : "-"}
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

        {docs.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h2 className="text-lg font-semibold mb-3">Certificates & Documents</h2>
              <ul className="space-y-2">
                {docs.map((d, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="truncate">{d.name || d.url.split("/").pop()}</span>
                    <a className="underline text-sm" href={d.url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

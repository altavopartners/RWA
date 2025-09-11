"use client";

import type React from "react";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Coins,
  Upload,
  Camera,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { useAuth } from "@/hooks/useAuth";

/* --- Taxonomy (exactly as you specified) --- */
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

type FormState = {
  name: string;
  quantity: string; // keep as string for input control, validate -> int
  unit: "kg" | "ton" | "piece" | "litre";
  pricePerUnit: string; // string -> float
  countryOfOrigin: string;
  category?: (typeof categories)[number]["id"];
  subcategory?: string;
  description: string;
  images?: File[]; // store arrays for easier preview/remove
  documents?: File[];
  hsCode?: string;
  incoterm?: "FOB" | "CIF" | "EXW" | "DAP" | "";
  minOrderQty?: string;
  leadTimeDays?: string;
};

type Errors = Partial<Record<keyof FormState | "form", string>>;

const REQUIRED_FIELDS: (keyof FormState)[] = [
  "name",
  "quantity",
  "unit",
  "pricePerUnit",
  "countryOfOrigin",
  "category",
  // subcategory is OPTIONAL per your schema
  "description",
];

const initialValues: FormState = {
  name: "Premium Cocoa Beans2",
  quantity: String(10030),
  unit: "kg",
  pricePerUnit: String(2.5),
  countryOfOrigin: "Ghana",
  category: "agri",
  subcategory: "cocoa",
  description:
    "FFFHigh-quality fermented and sun-dried cocoa beans sourced from smallholder farms. Certified organic and fair trade.",
  hsCode: "1801.00",
  incoterm: "FOB",
  minOrderQty: String(500),
  leadTimeDays: String(14),
  images: [],
  documents: [],
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const RequiredLabel = ({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) => (
  <Label htmlFor={htmlFor} className="flex items-center gap-1">
    <span>{children}</span>
    <span className="text-red-600">*</span>
  </Label>
);

const ProducerAddProduct = () => {
  const { isConnected } = useAuth();
  const { triggerConnect } = useWalletConnect();

  useEffect(() => {
    if (!isConnected) {
      triggerConnect();
    }
  }, [isConnected, triggerConnect]);

  if (!isConnected) {
    return (
      <div className="container py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Product Creation Access Required
          </h2>
          <p className="text-muted-foreground">
            Please connect your wallet to add products to the marketplace.
          </p>
        </Card>
      </div>
    );
  }

  return <ProducerAddProductContent />;
};

function ProducerAddProductContent() {
  const [form, setForm] = useState<FormState>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const imagesRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const availableSubcats = useMemo(
    () => (form.category ? subcategories[form.category] : []),
    [form.category]
  );

  // cleanup object URLs
  useEffect(() => {
    return () => {
      // no persistent object URLs here; previews use <img src={URL.createObjectURL(file) || "/placeholder.svg"} />
      // If you switch to memoized URLs, revoke them here.
    };
  }, []);

  const setField = (key: keyof FormState, value: any) =>
    setForm((s) => ({ ...s, [key]: value }));

  const handleChange =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setField(key, e.target.value);
    };

  const validate = (f: FormState): Errors => {
    const e: Errors = {};

    // required
    for (const k of REQUIRED_FIELDS) {
      const v: any = (f as any)[k];
      if (v === undefined || v === null || String(v).trim() === "") {
        e[k] = "This field is required.";
      }
    }

    // numbers
    if (
      f.quantity &&
      (!/^\d+$/.test(f.quantity) || Number.parseInt(f.quantity) <= 0)
    ) {
      e.quantity = "Quantity must be a positive integer.";
    }
    if (
      f.pricePerUnit &&
      (isNaN(Number(f.pricePerUnit)) || Number(f.pricePerUnit) <= 0)
    ) {
      e.pricePerUnit = "Price per unit must be a positive number.";
    }
    if (
      f.minOrderQty &&
      (!/^\d+$/.test(f.minOrderQty) || Number.parseInt(f.minOrderQty) <= 0)
    ) {
      e.minOrderQty = "Min order qty must be a positive integer.";
    }
    if (
      f.leadTimeDays &&
      (!/^\d+$/.test(f.leadTimeDays) || Number.parseInt(f.leadTimeDays) <= 0)
    ) {
      e.leadTimeDays = "Lead time must be a positive integer (days).";
    }

    // hsCode (optional, simple pattern like 4-6 digits with optional dot sections)
    if (f.hsCode && !/^\d{2,4}(?:\.|\d)*$/.test(f.hsCode)) {
      e.hsCode = "HS code looks invalid.";
    }

    // incoterm (optional)
    if (f.incoterm && !["FOB", "CIF", "EXW", "DAP", ""].includes(f.incoterm)) {
      e.incoterm = "Unknown incoterm.";
    }

    // description length hint
    if (f.description && f.description.trim().length < 20) {
      e.description = "Please add a bit more detail (min ~20 chars).";
    }

    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    const v = validate(form);
    setErrors(v);

    if (Object.keys(v).length > 0) {
      // scroll to top where the error summary lives
      setTimeout(
        () =>
          topRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        0
      );
      return;
    }

    // Build FormData for multipart/form-data
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("quantity", String(Number.parseInt(form.quantity)));
    fd.append("unit", form.unit);
    fd.append("pricePerUnit", String(Number(form.pricePerUnit)));
    fd.append("countryOfOrigin", form.countryOfOrigin.trim());
    fd.append("category", form.category!);
    if (form.subcategory) fd.append("subcategory", form.subcategory);
    fd.append("description", form.description.trim());
    if (form.hsCode) fd.append("hsCode", form.hsCode.trim());
    if (form.incoterm) fd.append("incoterm", form.incoterm);
    if (form.minOrderQty)
      fd.append("minOrderQty", String(Number.parseInt(form.minOrderQty)));
    if (form.leadTimeDays)
      fd.append("leadTimeDays", String(Number.parseInt(form.leadTimeDays)));
    (form.images || []).forEach((file) => fd.append("images", file));
    (form.documents || []).forEach((file) => fd.append("documents", file));

    try {
      setSubmitting(true);
      const res = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        body: fd, // browser sets content-type boundary
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log(data);
      setSuccessMsg("Product saved successfully.");
      // keep the filled values; if you want to clear, reset to initialValues
      // setForm(initialValues)
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        form: err?.message || "Failed to create product.",
      }));
      setTimeout(
        () =>
          topRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        0
      );
    } finally {
      setSubmitting(false);
    }
  };

  const imageFiles = form.images || [];
  const docFiles = form.documents || [];

  return (
    <Card className="p-8 glass border-border/50">
      <div ref={topRef} />
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <Coins className="w-6 h-6 mr-2 text-primary" />
        Create New Product
      </h2>

      {/* Error summary */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>We found some issues</AlertTitle>
          <AlertDescription>
            Please review the highlighted fields below. All fields marked with{" "}
            <span className="text-red-600 font-semibold">*</span> are required.
          </AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="mb-4 border-green-500/60">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name / Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <RequiredLabel htmlFor="name">Product Name</RequiredLabel>
            <Input
              id="name"
              placeholder="e.g., Premium Cocoa Beans"
              value={form.name}
              onChange={handleChange("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <RequiredLabel htmlFor="quantity">Quantity</RequiredLabel>
            <Input
              id="quantity"
              type="number"
              placeholder="1000"
              value={form.quantity}
              onChange={handleChange("quantity")}
              min={0}
              step="1"
              aria-invalid={!!errors.quantity}
            />
            {errors.quantity && (
              <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>
            )}
          </div>
        </div>

        {/* Unit / Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <RequiredLabel>Unit</RequiredLabel>
            <Select
              value={form.unit}
              onValueChange={(v: FormState["unit"]) => setField("unit", v)}
            >
              <SelectTrigger aria-invalid={!!errors.unit}>
                <SelectValue placeholder="kg / ton / piece / litre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="ton">ton</SelectItem>
                <SelectItem value="piece">piece</SelectItem>
                <SelectItem value="litre">litre</SelectItem>
              </SelectContent>
            </Select>
            {errors.unit && (
              <p className="text-sm text-red-600 mt-1">{errors.unit}</p>
            )}
          </div>
          <div>
            <RequiredLabel htmlFor="pricePerUnit">
              Price per unit (USD)
            </RequiredLabel>
            <Input
              id="pricePerUnit"
              type="number"
              step="0.01"
              placeholder="2.50"
              value={form.pricePerUnit}
              onChange={handleChange("pricePerUnit")}
              min={0}
              aria-invalid={!!errors.pricePerUnit}
            />
            {errors.pricePerUnit && (
              <p className="text-sm text-red-600 mt-1">{errors.pricePerUnit}</p>
            )}
          </div>
        </div>

        {/* Country / HS / Incoterm */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <RequiredLabel htmlFor="countryOfOrigin">
              Country of Origin
            </RequiredLabel>
            <Input
              id="countryOfOrigin"
              placeholder="Ghana"
              value={form.countryOfOrigin}
              onChange={handleChange("countryOfOrigin")}
              aria-invalid={!!errors.countryOfOrigin}
            />
            {errors.countryOfOrigin && (
              <p className="text-sm text-red-600 mt-1">
                {errors.countryOfOrigin}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="hsCode">HS Code (optional)</Label>
            <Input
              id="hsCode"
              placeholder="1801.00"
              value={form.hsCode || ""}
              onChange={handleChange("hsCode")}
              aria-invalid={!!errors.hsCode}
            />
            {errors.hsCode && (
              <p className="text-sm text-red-600 mt-1">{errors.hsCode}</p>
            )}
          </div>
          <div>
            <Label>Incoterm (optional)</Label>
            <Select
              value={form.incoterm || ""}
              onValueChange={(v: NonNullable<FormState["incoterm"]>) =>
                setField("incoterm", v)
              }
            >
              <SelectTrigger aria-invalid={!!errors.incoterm}>
                <SelectValue placeholder="FOB / CIF / EXW / DAP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FOB">FOB</SelectItem>
                <SelectItem value="CIF">CIF</SelectItem>
                <SelectItem value="EXW">EXW</SelectItem>
                <SelectItem value="DAP">DAP</SelectItem>
              </SelectContent>
            </Select>
            {errors.incoterm && (
              <p className="text-sm text-red-600 mt-1">{errors.incoterm}</p>
            )}
          </div>
        </div>

        {/* MOQ / Lead time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minOrderQty">Min Order Qty (optional)</Label>
            <Input
              id="minOrderQty"
              type="number"
              placeholder="500"
              value={form.minOrderQty || ""}
              onChange={handleChange("minOrderQty")}
              min={0}
              step="1"
              aria-invalid={!!errors.minOrderQty}
            />
            {errors.minOrderQty && (
              <p className="text-sm text-red-600 mt-1">{errors.minOrderQty}</p>
            )}
          </div>
          <div>
            <Label htmlFor="leadTimeDays">Lead Time (days, optional)</Label>
            <Input
              id="leadTimeDays"
              type="number"
              placeholder="14"
              value={form.leadTimeDays || ""}
              onChange={handleChange("leadTimeDays")}
              min={0}
              step="1"
              aria-invalid={!!errors.leadTimeDays}
            />
            {errors.leadTimeDays && (
              <p className="text-sm text-red-600 mt-1">{errors.leadTimeDays}</p>
            )}
          </div>
        </div>

        {/* Category / Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <RequiredLabel>Category</RequiredLabel>
            <Select
              value={form.category}
              onValueChange={(v: string | undefined) =>
                setForm((s) => ({
                  ...s,
                  category: v as FormState["category"],
                  subcategory: undefined,
                }))
              }
            >
              <SelectTrigger aria-invalid={!!errors.category}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <Label>Subcategory (optional)</Label>
            <Select
              value={form.subcategory}
              onValueChange={(v: any) => setField("subcategory", v)}
              disabled={!form.category}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    form.category
                      ? "Pick a subcategory"
                      : "Select a category first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(availableSubcats || []).map((sc) => (
                  <SelectItem key={sc.id} value={sc.id}>
                    {sc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div>
          <RequiredLabel htmlFor="description">Description</RequiredLabel>
          <Textarea
            id="description"
            rows={4}
            placeholder="Describe your product, farming methods, certifications..."
            value={form.description}
            onChange={handleChange("description")}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description}</p>
          )}
        </div>

        <Separator />

        {/* Images */}
        <div className="space-y-2">
          <Label>Product Images</Label>
          <input
            ref={imagesRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              setField("images", Array.from(e.target.files || []))
            }
          />
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Camera className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
              {imageFiles.length > 0 ? (
                <>
                  <Badge variant="secondary" className="text-sm">
                    {imageFiles.length} image{imageFiles.length > 1 ? "s" : ""}{" "}
                    selected
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {imageFiles
                      .map((f) => f.name)
                      .slice(0, 2)
                      .join(", ")}
                    {imageFiles.length > 2
                      ? ` +${imageFiles.length - 2} more`
                      : ""}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No files chosen yet
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => imagesRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Images
            </Button>

            {/* Thumbs */}
            {imageFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imageFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden border"
                  >
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt={file.name}
                      className="aspect-video object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          "images",
                          imageFiles.filter((_, i) => i !== idx)
                        )
                      }
                      className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute left-1 bottom-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {formatBytes(file.size)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-2">
          <Label>Certificates & Documentation</Label>
          <input
            ref={docsRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) =>
              setField("documents", Array.from(e.target.files || []))
            }
          />
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <FileCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
              {docFiles.length > 0 ? (
                <>
                  <Badge variant="secondary" className="text-sm">
                    {docFiles.length} file{docFiles.length > 1 ? "s" : ""}{" "}
                    selected
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {docFiles
                      .map((f) => f.name)
                      .slice(0, 3)
                      .join(", ")}
                    {docFiles.length > 3 ? ` +${docFiles.length - 3} more` : ""}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No files chosen yet
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => docsRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>

            {/* Doc list */}
            {docFiles.length > 0 && (
              <ul className="mt-4 text-left text-sm">
                {docFiles.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 py-1 border-b last:border-b-0"
                  >
                    <span className="truncate" title={f.name}>
                      {f.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(f.size)}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setField(
                            "documents",
                            docFiles.filter((_, i) => i !== idx)
                          )
                        }
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save Product"}
        </Button>

        {/* API-level error */}
        {errors.form && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Couldn’t save</AlertTitle>
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}
      </form>

      <p className="mt-6 text-xs text-muted-foreground">
        Fields marked with <span className="text-red-600 font-semibold">*</span>{" "}
        are required per your database schema.
      </p>
    </Card>
  );
}

export default ProducerAddProduct;

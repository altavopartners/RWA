import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Upload, Camera, FileCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  quantity: string;
  unit: "kg" | "ton" | "piece" | "litre";
  pricePerUnit: string;
  countryOfOrigin: string;
  category?: (typeof categories)[number]["id"];
  subcategory?: string;
  description: string;
  images?: FileList | null;
  documents?: FileList | null;
  hsCode?: string;
  incoterm?: "FOB" | "CIF" | "EXW" | "DAP" | "";
  minOrderQty?: string;
  leadTimeDays?: string;
};

const ProducerAddProduct = () => {
  const [form, setForm] = useState<FormState>({
    name: "",
    quantity: "",
    unit: "kg",
    pricePerUnit: "",
    countryOfOrigin: "",
    description: "",
    incoterm: "",
  });

  const imagesRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);

  const availableSubcats = useMemo(
    () => (form.category ? subcategories[form.category] : []),
    [form.category]
  );

  const handleChange =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((s) => ({ ...s, [key]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.category || !form.subcategory) return;

    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
      unit: form.unit,
      pricePerUnit: Number(form.pricePerUnit),
      countryOfOrigin: form.countryOfOrigin.trim(),
      category: form.category,
      subcategory: form.subcategory,
      description: form.description.trim(),
      hsCode: form.hsCode?.trim() || null,
      incoterm: form.incoterm || null,
      minOrderQty: form.minOrderQty ? Number(form.minOrderQty) : null,
      leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : null,
      images: form.images ?? null,     // FileList (send as multipart later)
      documents: form.documents ?? null, // FileList
    };

    console.log("CREATE PRODUCT PAYLOAD →", payload);
    // TODO: replace console.log with your API call
    // e.g., first upload files, then POST JSON
  };

  return (
    <Card className="p-8 glass border-border/50">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Coins className="w-6 h-6 mr-2 text-primary" />
        Create New Product
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name / Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="e.g., Premium Cocoa Beans"
              value={form.name}
              onChange={handleChange("name")}
              required
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="1000"
              value={form.quantity}
              onChange={handleChange("quantity")}
              min={0}
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Unit / Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Unit</Label>
            <Select
              value={form.unit}
              onValueChange={(v: FormState["unit"]) => setForm((s) => ({ ...s, unit: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="kg / ton / piece / litre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="ton">ton</SelectItem>
                <SelectItem value="piece">piece</SelectItem>
                <SelectItem value="litre">litre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pricePerUnit">Price per unit (USD)</Label>
            <Input
              id="pricePerUnit"
              type="number"
              step="0.01"
              placeholder="2.50"
              value={form.pricePerUnit}
              onChange={handleChange("pricePerUnit")}
              min={0}
              required
            />
          </div>
        </div>

        {/* Country / HS / Incoterm */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="countryOfOrigin">Country of Origin</Label>
            <Input
              id="countryOfOrigin"
              placeholder="Ghana"
              value={form.countryOfOrigin}
              onChange={handleChange("countryOfOrigin")}
              required
            />
          </div>
          <div>
            <Label htmlFor="hsCode">HS Code (optional)</Label>
            <Input
              id="hsCode"
              placeholder="1801.00"
              value={form.hsCode || ""}
              onChange={handleChange("hsCode")}
            />
          </div>
          <div>
            <Label>Incoterm (optional)</Label>
            <Select
              value={form.incoterm || ""}
              onValueChange={(v: NonNullable<FormState["incoterm"]>) =>
                setForm((s) => ({ ...s, incoterm: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="FOB / CIF / EXW / DAP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FOB">FOB</SelectItem>
                <SelectItem value="CIF">CIF</SelectItem>
                <SelectItem value="EXW">EXW</SelectItem>
                <SelectItem value="DAP">DAP</SelectItem>
              </SelectContent>
            </Select>
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
              step="0.01"
            />
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
            />
          </div>
        </div>

        {/* Category / Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v: string | undefined) =>
                setForm((s) => ({ ...s, category: v as FormState["category"], subcategory: undefined }))
              }
            >
              <SelectTrigger>
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
          </div>

          <div>
            <Label>Subcategory</Label>
            <Select
              value={form.subcategory}
              onValueChange={(v: any) => setForm((s) => ({ ...s, subcategory: v }))}
              disabled={!form.category}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={form.category ? "Pick a subcategory" : "Select a category first"}
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
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder="Describe your product, farming methods, certifications..."
            value={form.description}
            onChange={handleChange("description")}
            required
          />
        </div>

        {/* Images */}
        <div className="space-y-2">
          <Label>Product Images</Label>
          <input
            ref={imagesRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => setForm((s) => ({ ...s, images: e.target.files }))}
          />
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <Button type="button" variant="outline" onClick={() => imagesRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
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
            onChange={(e) => setForm((s) => ({ ...s, documents: e.target.files }))}
          />
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <FileCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <Button type="button" variant="outline" onClick={() => docsRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </div>
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full">
          Save Product
        </Button>
      </form>
    </Card>
  );
};

export default ProducerAddProduct;

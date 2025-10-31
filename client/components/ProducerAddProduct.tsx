"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Coins, Upload, Camera, FileCheck, AlertTriangle, CheckCircle2, X, Package, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { useRouter } from "next/navigation";
import { constructApiUrl } from "@/config/api";
import Footer from "@/components/Footer";

const africanCountries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", "Cape Verde",
  "Central African Republic", "Chad", "Comoros", "Congo", "Democratic Republic of the Congo",
  "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya",
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
  "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone",
  "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda",
  "Zambia", "Zimbabwe"
];

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
  images?: File[];
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
  "description",
];

const initialValues: FormState = {
  name: "",
  quantity: "",
  unit: "kg",
  pricePerUnit: "",
  countryOfOrigin: "",
  category: undefined,
  subcategory: undefined,
  description: "",
  hsCode: "",
  incoterm: "",
  minOrderQty: "",
  leadTimeDays: "",
  images: [],
  documents: [],
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const RequiredLabel = ({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) => (
  <Label htmlFor={htmlFor} className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium">
    <span>{children}</span>
    <span className="text-[#88CEDC]">*</span>
  </Label>
);

const ProducerAddProductPage = () => {
  const { isConnected } = useAuth();
  const { triggerConnect } = useWalletConnect();
  const [isChecking, setIsChecking] = useState(true);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isConnected && !hasCheckedOnce) {
        setHasCheckedOnce(true);
        await triggerConnect();
      }
      setIsChecking(false);
    };
    
    checkConnection();
  }, [isConnected, triggerConnect, hasCheckedOnce]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 -mt-16">
        <div className="relative bg-gradient-to-br from-[#486C7A] via-[#265663] to-[#0C171B] pt-32 pb-20">
          <div className="relative z-10 container mx-auto px-6 pt-12">
            <Card className="p-12 text-center max-w-md mx-auto bg-white dark:bg-gray-900">
              <div className="w-20 h-20 bg-[#88CEDC]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-[#88CEDC] animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                Checking Connection...
              </h2>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 -mt-16">
        <div className="relative bg-gradient-to-br from-[#486C7A] via-[#265663] to-[#0C171B] pt-32 pb-20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#88CEDC] rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 container mx-auto px-6 pt-12">
            <Card className="p-12 text-center max-w-md mx-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xl">
              <div className="w-20 h-20 bg-[#88CEDC]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-[#88CEDC]" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Producer Access Required</h2>
              <p className="text-muted-foreground mb-6">Please connect your wallet to add products.</p>
              <Button onClick={triggerConnect} className="bg-[#88CEDC] hover:bg-[#7BC0CF] text-white">
                Connect Wallet
              </Button>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <ProducerAddProductPageContent />;
};

const ProducerAddProductPageContent = () => {
  const [form, setForm] = useState<FormState>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const imagesRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const availableSubcats = useMemo(
    () => (form.category ? subcategories[form.category] : []),
    [form.category]
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const handleChange =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setField(key, e.target.value);
    };

  const validate = (f: FormState): Errors => {
    const e: Errors = {};

    for (const k of REQUIRED_FIELDS) {
      const v = f[k];
      if (v === undefined || v === null || String(v).trim() === "") {
        e[k] = "This field is required.";
      }
    }

    if (!f.images || f.images.length < 1) {
      e.images = "Please upload at least one image.";
    }

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
    if (f.hsCode && !/^\d{2,4}(?:\.|\d)*$/.test(f.hsCode)) {
      e.hsCode = "HS code looks invalid.";
    }
    if (f.incoterm && !["FOB", "CIF", "EXW", "DAP", ""].includes(f.incoterm)) {
      e.incoterm = "Unknown incoterm.";
    }
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
    
    const wallet =
      typeof window !== "undefined"
        ? localStorage.getItem("walletAddress")
        : null;
    if (wallet && wallet !== "null") {
      fd.append("producerWalletId", String(wallet));
    }

    try {
      setSubmitting(true);
      const res = await fetch(constructApiUrl("/api/products"), {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      setSuccessMsg("Product created successfully!");
      setTimeout(() => router.push("/marketplace"), 2000);
    } catch (err: unknown) {
      setErrors((prev) => ({
        ...prev,
        form: err instanceof Error ? err.message : "Failed to create product.",
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
    <div className="min-h-screen bg-white dark:bg-gray-950 -mt-16">
      {/* Hero Header Section */}
      <div className="relative bg-gradient-to-br from-[#486C7A] via-[#265663] to-[#0C171B] pt-32 pb-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#88CEDC] rounded-full blur-3xl" />
        </div>

        <div className="pt-20 relative z-10 container mx-auto px-6 text-center">
          <div ref={topRef} />
          <div className="inline-block p-3 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 shadow-lg">
            <Package className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white" style={{ color: '#edf6f9' }}>
            List Your Product
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Tokenize your exports and reach global buyers through the power of Web3 ✨
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 -mt-8 relative z-20">
        {successMsg && (
          <Alert className="mb-6 border-green-500/60 bg-green-50 dark:bg-green-950/30 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900 dark:text-green-100">Success!</AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">{successMsg}</AlertDescription>
          </Alert>
        )}

        {Object.keys(errors).length > 0 && !successMsg && (
          <Alert variant="destructive" className="mb-6 shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Please fix the following issues</AlertTitle>
            <AlertDescription>Check the highlighted fields below. Fields marked with <span className="text-[#88CEDC] font-semibold">*</span> are required.</AlertDescription>
          </Alert>
        )}

        <Card className="p-8 md:p-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <p className="text-center text-sm text-muted-foreground">
                Fields marked with <span className="text-[#88CEDC] font-semibold">*</span> are required
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] flex items-center justify-center text-white font-bold shadow-lg">1</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RequiredLabel htmlFor="name">Product Name</RequiredLabel>
                  <Input 
                    id="name" 
                    placeholder="e.g., Premium Ethiopian Coffee Beans" 
                    value={form.name} 
                    onChange={handleChange("name")} 
                    className={`mt-2 ${errors.name ? 'border-red-500' : ''}`} 
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <RequiredLabel>Unit</RequiredLabel>
                  <Select value={form.unit} onValueChange={(v: FormState["unit"]) => setField("unit", v)}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="ton">Tons</SelectItem>
                      <SelectItem value="piece">Pieces</SelectItem>
                      <SelectItem value="litre">Litres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <RequiredLabel htmlFor="quantity">Quantity Available</RequiredLabel>
                  <Input 
                    id="quantity" 
                    type="number" 
                    placeholder="1000" 
                    value={form.quantity} 
                    onChange={handleChange("quantity")} 
                    className={`mt-2 ${errors.quantity ? 'border-red-500' : ''}`} 
                  />
                  {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>}
                </div>

                <div>
                  <RequiredLabel htmlFor="pricePerUnit">Price per Unit (HBAR)</RequiredLabel>
                  <div className="relative mt-2">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      id="pricePerUnit" 
                      type="number" 
                      step="0.01" 
                      placeholder="2.50" 
                      value={form.pricePerUnit} 
                      onChange={handleChange("pricePerUnit")} 
                      className={`pl-10 ${errors.pricePerUnit ? 'border-red-500' : ''}`} 
                    />
                  </div>
                  {errors.pricePerUnit && <p className="text-sm text-red-600 mt-1">{errors.pricePerUnit}</p>}
                </div>

                <div>
                  <RequiredLabel htmlFor="countryOfOrigin">Country of Origin</RequiredLabel>
                  <select 
                    id="countryOfOrigin"
                    value={form.countryOfOrigin} 
                    onChange={(e) => setField("countryOfOrigin", e.target.value)}
                    className={`mt-2 w-full rounded-md border ${errors.countryOfOrigin ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#88CEDC] focus:border-transparent appearance-none cursor-pointer`}
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '12px'
                    }}
                  >
                    <option value="">Select your country</option>
                    {africanCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {errors.countryOfOrigin && <p className="text-sm text-red-600 mt-1">{errors.countryOfOrigin}</p>}
                </div>
              </div>
            </div>

            <div className="border-t dark:border-gray-800" />

            {/* Product Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] flex items-center justify-center text-white font-bold shadow-lg">2</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <RequiredLabel>Category</RequiredLabel>
                  <Select 
                    value={form.category} 
                    onValueChange={(v: string) => setForm((s) => ({ ...s, category: v as FormState["category"], subcategory: undefined }))}
                  >
                    <SelectTrigger className={`mt-2 ${errors.category ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label>Subcategory (optional)</Label>
                  <Select value={form.subcategory} onValueChange={(v) => setField("subcategory", v)} disabled={!form.category}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={form.category ? "Select subcategory" : "Choose category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcats.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id}>{sc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>HS Code (optional)</Label>
                  <Input placeholder="e.g., 1801.00" value={form.hsCode || ""} onChange={handleChange("hsCode")} className="mt-2" />
                </div>

                <div>
                  <Label>Incoterm (optional)</Label>
                  <Select value={form.incoterm || ""} onValueChange={(v: NonNullable<FormState["incoterm"]>) => setField("incoterm", v)}>
                    <SelectTrigger className="mt-2"><SelectValue placeholder="Select incoterm" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB (Free on Board)</SelectItem>
                      <SelectItem value="CIF">CIF (Cost, Insurance, Freight)</SelectItem>
                      <SelectItem value="EXW">EXW (Ex Works)</SelectItem>
                      <SelectItem value="DAP">DAP (Delivered at Place)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Min Order Quantity (optional)</Label>
                  <Input type="number" placeholder="500" value={form.minOrderQty || ""} onChange={handleChange("minOrderQty")} className="mt-2" />
                </div>

                <div>
                  <Label>Lead Time (days, optional)</Label>
                  <Input type="number" placeholder="14" value={form.leadTimeDays || ""} onChange={handleChange("leadTimeDays")} className="mt-2" />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <RequiredLabel htmlFor="description">Description</RequiredLabel>
                  <Textarea 
                    id="description" 
                    rows={4} 
                    placeholder="Describe your product, quality standards, certifications..." 
                    value={form.description} 
                    onChange={handleChange("description")} 
                    className={`mt-2 ${errors.description ? 'border-red-500' : ''}`} 
                  />
                  {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                </div>
              </div>
            </div>

            <div className="border-t dark:border-gray-800" />

            {/* Images & Documents */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] flex items-center justify-center text-white font-bold shadow-lg">3</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Images & Documents</h2>
              </div>

              <div>
                <RequiredLabel>Product Images</RequiredLabel>
                <input ref={imagesRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => setField("images", Array.from(e.target.files || []))} />
                <div className={`mt-2 border-2 border-dashed rounded-xl p-8 text-center transition-all hover:border-[#88CEDC] dark:hover:border-[#88CEDC] bg-gray-50 dark:bg-gray-800/50 ${errors.images ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}>
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  {imageFiles.length > 0 ? (
                    <Badge className="bg-[#88CEDC] text-white mb-2">{imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} selected</Badge>
                  ) : (
                    <p className="text-muted-foreground mb-4">Drag and drop or click to upload</p>
                  )}
                  <Button type="button" onClick={() => imagesRef.current?.click()} className="bg-[#88CEDC] hover:bg-[#7BC0CF] text-white">
                    <Upload className="w-4 h-4 mr-2" />Choose Images
                  </Button>
                </div>
                {errors.images && <p className="text-sm text-red-600 mt-1">{errors.images}</p>}

                {imageFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imageFiles.map((file, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border">
                        <img src={URL.createObjectURL(file)} alt={file.name} className="aspect-square object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setField("images", imageFiles.filter((_, i) => i !== idx))} 
                          className="absolute top-2 right-2 bg-white hover:bg-red-500 text-gray-900 hover:text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Certificates & Documentation (optional)</Label>
                <input ref={docsRef} type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setField("documents", Array.from(e.target.files || []))} />
                <div className="mt-2 border-2 border-dashed rounded-xl p-8 text-center transition-all hover:border-[#88CEDC] dark:hover:border-[#88CEDC] border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  {docFiles.length > 0 && <Badge className="bg-[#88CEDC] text-white mb-4">{docFiles.length} document{docFiles.length > 1 ? 's' : ''}</Badge>}
                  <Button type="button" variant="outline" onClick={() => docsRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />Upload Documents
                  </Button>
                </div>

                {docFiles.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {docFiles.map((f, idx) => (
                      <li key={idx} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="truncate text-sm text-gray-900 dark:text-gray-100">{f.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                          <Button type="button" size="icon" variant="ghost" onClick={() => setField("documents", docFiles.filter((_, i) => i !== idx))}>
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
              size="lg" 
              className="w-full bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white font-bold py-6" 
              disabled={submitting || (form.images?.length ?? 0) < 1}
            >
              {submitting ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Creating Your Product...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  List Product on Marketplace
                </>
              )}
            </Button>

            {errors.form && (
              <Alert variant="destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Submission Failed</AlertTitle>
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}
          </form>
        </Card>

        <div className="py-12" />
      </div>

      <Footer />
    </div>
  );
};

export default ProducerAddProductPage;
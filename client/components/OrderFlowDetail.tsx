"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Truck,
  CheckCircle,
  Clock,
  Package,
  Shield,
  AlertCircle,
  Upload,
  FileText,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Lock,
  HandCoins,
} from "lucide-react";
import type { Order } from "./OrderFlow";

// ===== API base =====
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/$/, "");

// ===== MetaMask / Hedera helpers =====
type Eip1193Provider = {
  request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
};
declare global {
  interface Window {
    ethereum?: any;
  }
}

const HEDERA_TESTNET = {
  chainId: "0x128", // 296 decimal
  chainName: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

async function ensureHederaTestnet(provider: Eip1193Provider) {
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: HEDERA_TESTNET.chainId }] });
  } catch (err: any) {
    if (err?.code === 4902) {
      await provider.request({ method: "wallet_addEthereumChain", params: [HEDERA_TESTNET] });
    } else {
      throw err;
    }
  }
}

function toWeiHex(amountHBAR: string | number): string {
  const s = String(amountHBAR);
  const [intPart, frac = ""] = s.split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  const weiStr = (
    BigInt(intPart || "0") * BigInt(Math.pow(10, 18)) +
    BigInt(fracPadded || "0")
  ).toString(16);
  return "0x" + weiStr;
}

// ===== Money UI (HBAR) =====
function money(n: number, w: number = 4) {
  const formatted = new Intl.NumberFormat(undefined, {
    style: "decimal",
    maximumFractionDigits: 8,
  }).format(n);

  return (
    <span className="flex items-center gap-1">
      <span style={{ fontWeight: "normal" }}>{formatted}</span>
      <span
        className={`inline-block w-${w} h-${w} bg-contain bg-no-repeat flex-shrink-0`}
        style={{ backgroundImage: `url(/assets/hbar_logo.png)` }}
      />
      <span style={{ fontWeight: "normal", color: "black" }}>BAR</span>
    </span>
  );
}

// ===== Types for documents =====
export type DocumentItem = {
  id: string;
  fileName: string;
  url: string;
  size?: number;
  uploadedAt?: string;
  categoryKey: string; // e.g. "commercial"
  typeKey: string; // e.g. "commercial_invoice"
  status?: "uploaded" | "verified" | "rejected" | "pending";
};

type Props = {
  order: Order;
  loadingDetail?: boolean;
  onConfirmDelivery?: () => void;
  onDispute?: () => void;
  documents?: DocumentItem[];
  onUploadDoc?: (file: File, meta: { categoryKey: string; typeKey: string; orderId: string }) => Promise<DocumentItem>;
  onDeleteDoc?: (doc: DocumentItem) => Promise<void>;
};

// ===== Helpers =====
const toNumber = (n: any, d = 0) => {
  const v = typeof n === "string" ? Number.parseFloat(n) : Number(n);
  return Number.isFinite(v) ? v : d;
};

const pickFirstImageUrl = (images: any): string | null => {
  if (!images) return null;
  if (Array.isArray(images) && images.length && images[0]?.path) return `${API_BASE}${images[0].path}`;
  if (typeof images === "string") return images;
  if (Array.isArray(images) && typeof images[0] === "string") return images[0];
  if (typeof images === "object" && (images as any).path) return `${API_BASE}${(images as any).path}`;
  return null;
};

// ===== Document taxonomy =====
const DOC_CATEGORIES: {
  key: string;
  label: string;
  docs: { key: string; label: string; required?: boolean }[];
}[] = [
  {
    key: "commercial",
    label: "Documents Commerciaux",
    docs: [
      { key: "commercial_invoice", label: "Facture commerciale (Commercial Invoice)", required: true },
      { key: "packing_list", label: "Liste de colisage (Packing List)" },
    ],
  },
  {
    key: "transport",
    label: "Documents de Transport",
    docs: [
      { key: "bill_of_lading", label: "Connaissement Maritime (Bill of Lading - B/L)" },
      { key: "air_waybill", label: "Lettre de transport aérien (Air Waybill - AWB)" },
      { key: "cmr", label: "CMR (Convention des Marchandises par Route)" },
      { key: "fcr", label: "FCR (Forwarder’s Cargo Receipt)" },
    ],
  },
  {
    key: "insurance",
    label: "Documents d'Assurance",
    docs: [{ key: "insurance_policy", label: "Police d'assurance (Insurance Policy/Certificate)" }],
  },
  {
    key: "origin_control",
    label: "Documents d'Origine et Contrôle",
    docs: [
      { key: "certificate_of_origin", label: "Certificat d'origine (Certificate of Origin)" },
      { key: "inspection_certificate", label: "Certificat d'inspection (Inspection Certificate)" },
    ],
  },
  {
    key: "other",
    label: "Autres Documents",
    docs: [{ key: "sanitary_certificate", label: "Certificat sanitaire / phytosanitaire" }],
  },
];

// ===== Badges =====
const statusBadge = (s?: DocumentItem["status"]) => {
  switch (s) {
    case "verified":
      return <Badge className="bg-green-600 text-white">Verified</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "pending":
      return (
        <Badge variant="outline" className="border-dashed">
          Pending
        </Badge>
      );
    case "uploaded":
      return <Badge className="bg-green-600 text-white">Uploaded</Badge>;
    default:
      return <Badge variant="secondary">Uploaded</Badge>;
  }
};

// ===== Auth helpers =====
function useReactiveToken(key = "jwtToken") {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => setToken(localStorage.getItem(key));
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [key]);
  return token;
}

function authHeaderFrom(token: string | null | undefined): Record<string, string> {
  if (!token) return {};
  const value = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  return { Authorization: value };
}

// ===== Document Upload Card =====
function DocumentCenter({
  order,
  documents = [],
  onUploadDoc,
  onDeleteDoc,
}: Pick<Props, "order" | "documents" | "onUploadDoc" | "onDeleteDoc">) {
  const [categoryKey, setCategoryKey] = useState("commercial");
  const [typeKey, setTypeKey] = useState(DOC_CATEGORIES[0].docs[0].key);
  const [busy, setBusy] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

// --- état local + resync SANS boucle infinie
const [localDocs, setLocalDocs] = useState<DocumentItem[]>(() => documents ?? []);
const prevDocsRef = useRef<DocumentItem[] | null>(null);

function shallowEqualDocs(a?: DocumentItem[] | null, b?: DocumentItem[] | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  // on compare les champs qui impactent l’UI; adapte si besoin
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (
      x.id !== y.id ||
      x.categoryKey !== y.categoryKey ||
      x.typeKey !== y.typeKey ||
      x.url !== y.url ||
      x.status !== y.status
    ) return false;
  }
  return true;
}

useEffect(() => {
  const next = documents ?? [];
  const prev = prevDocsRef.current;
  if (!shallowEqualDocs(prev, next)) {
    setLocalDocs(next);
    prevDocsRef.current = next;
  }
}, [documents]);


  const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.heic,.tiff,.doc,.docx";
  const acceptList = ACCEPT.split(",").map((s) => s.trim().toLowerCase());
  const isAllowed = (file: File) => acceptList.some((ext) => file.name.toLowerCase().endsWith(ext));

  const docsMap = useMemo(() => {
    const m = new Map<string, DocumentItem[]>();
    for (const d of localDocs) {
      const k = `${d.categoryKey}:${d.typeKey}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(d);
    }
    return m;
  }, [localDocs]);

  const currentCat = useMemo(() => DOC_CATEGORIES.find((c) => c.key === categoryKey)!, [categoryKey]);

  // Reactive token from localStorage
  const token = useReactiveToken("jwtToken");

  const doUpload = async (file: File) => {
    setError(null);
    if (!isAllowed(file)) {
      setError("Unsupported file type.");
      return;
    }
    setBusy(true);
    try {
      let saved: DocumentItem | undefined;

      if (onUploadDoc) {
        saved = await onUploadDoc(file, {
          categoryKey,
          typeKey,
          orderId: String((order as any).id || (order as any).orderId),
        });
      } else {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("categoryKey", categoryKey);
        fd.append("typeKey", typeKey);
        fd.append("orderId", String((order as any).id || (order as any).orderId));

        const res = await fetch(`${API_BASE}/api/documents/upload`, {
          method: "POST",
          body: fd,
          headers: { ...authHeaderFrom(token) },
        });

        if (!res.ok) {
          let message = `Upload failed (${res.status})`;
          try {
            const data = await res.json();
            if (data?.message) message = data.message;
            if (data?.error) message = data.error;
          } catch {}
          throw new Error(message);
        }

        saved = await res.json();
      }

      if (saved) {
        // Hydrate pour garantir les champs nécessaires à l’UI
        const hydrated: DocumentItem = {
          id: saved.id ?? crypto.randomUUID(),
          fileName: saved.fileName ?? file.name,
          url: saved.url ?? (saved as any).path ?? "",
          categoryKey: saved.categoryKey ?? categoryKey,
          typeKey: saved.typeKey ?? typeKey,
          size: saved.size ?? file.size,
          uploadedAt: saved.uploadedAt ?? new Date().toISOString(),
          status: saved.status ?? "uploaded",
        };

        setLocalDocs((prev) => [hydrated, ...prev]);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(Boolean);
    for (const f of arr) {
      await doUpload(f);
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (busy) return;

    const dt = e.dataTransfer;
    const picked: File[] = [];

    if (dt.items && dt.items.length) {
      for (const item of Array.from(dt.items)) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) picked.push(f);
        }
      }
    } else if (dt.files && dt.files.length) {
      for (const f of Array.from(dt.files)) picked.push(f);
    }

    if (picked.length) await handleFiles(picked);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setIsDragging(true);
    try {
      e.dataTransfer.dropEffect = "copy";
    } catch {}
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) await handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = ""; // reset
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    if (busy) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of Array.from(items)) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) await handleFiles(files);
  };

  return (
    <Card className="glass border-border/50 p-6" onPaste={onPaste}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Documents & Upload</h3>
        <Badge variant="outline" className="bg-muted/40">
          Order #{(order as any).code}
        </Badge>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="w-full">
          <Label className="text-xs">Category</Label>
          <select
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
            value={categoryKey}
            onChange={(e) => {
              const ck = e.target.value;
              setCategoryKey(ck);
              const first = DOC_CATEGORIES.find((c) => c.key === ck)!.docs[0]?.key;
              if (first) setTypeKey(first);
            }}
          >
            {DOC_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full">
          <Label className="text-xs">Document Type</Label>
          <select
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
            value={typeKey}
            onChange={(e) => setTypeKey(e.target.value)}
          >
            {currentCat.docs.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
                {d.required ? " *" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full flex flex-col justify-end">
          <Button disabled={busy} onClick={() => fileInputRef.current?.click()} className="w-full">
            <Upload className="w-4 h-4 mr-2" /> Choose file
          </Button>
          <input ref={fileInputRef} type="file" onChange={onPick} accept={ACCEPT} className="hidden" multiple />
        </div>
      </div>

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition select-none focus:outline-none focus:ring-2 focus:ring-ring/50 ${
          isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/40"
        } ${busy ? "opacity-70 pointer-events-none" : ""}`}
        aria-label="Upload files by drag-and-drop or click"
      >
        <Upload className="w-6 h-6 mx-auto mb-2" />
        <p className="text-sm">Drag & drop files here, click to choose, or paste from clipboard.</p>
        {busy && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>

      {/* Toggle Available Docs */}
      <div className="mt-4 text-center">
        <Button variant="ghost" size="sm" onClick={() => setShowDocs((s) => !s)}>
          {showDocs ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" /> Hide Documents
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" /> Voir plus
            </>
          )}
        </Button>
      </div>

      {showDocs && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Available Documents</h4>
          <div className="space-y-4">
            {DOC_CATEGORIES.map((cat) => (
              <div key={cat.key}>
                <p className="text-sm font-semibold">{cat.label}</p>
                <div className="mt-2 grid sm:grid-cols-2 gap-2">
                  {cat.docs.map((d) => {
                    const list = docsMap.get(`${cat.key}:${d.key}`) || [];
                    const has = list.length > 0;
                    const firstStatus = list[0]?.status ?? "uploaded";

                    return (
                      <div
                        key={d.key}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 bg-background"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm truncate">{d.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {has ? `${list.length} file${list.length > 1 ? "s" : ""}` : d.required ? "Required" : "Optional"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {has ? statusBadge(firstStatus) : <Badge variant="outline" className="border-dashed">Missing</Badge>}
                          {has && (
                            <div className="flex items-center gap-1">
                              {list.map((doc) => (
                                <a
                                  key={doc.id}
                                  href={doc.url.startsWith("http") ? doc.url : `${API_BASE}${doc.url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center text-xs underline"
                                >
                                  <Download className="w-3 h-3 mr-1" /> View
                                </a>
                              ))}
                              {onDeleteDoc && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={async () => {
                                    await onDeleteDoc(list[0]);
                                    setLocalDocs((prev) => prev.filter((x) => x.id !== list[0].id));
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function OrderFlowDetail({
  order,
  loadingDetail,
  onConfirmDelivery,
  onDispute,
  documents,
  onUploadDoc,
  onDeleteDoc,
}: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "bank_verification":
        return "bg-yellow-500";
      case "ready_for_shipment":
      case "in_transit":
        return "bg-sky-500";
      case "delivered":
        return "bg-green-600";
      case "disputed":
        return "bg-red-600";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "bank_verification":
        return Shield;
      case "ready_for_shipment":
        return Package;
      case "in_transit":
        return Truck;
      case "delivered":
        return CheckCircle;
      case "disputed":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const labelFor = (s: string) => {
    if (!s) return "";
    const clean = s.replace(/_/g, " ").toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const StatusIcon = getStatusIcon((order as any).status);
  const itemsCount = order.items?.length || 0;

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handlePay() {
    setPayError(null);
    setTxHash(null);
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not detected. Please install or enable it.");
      }
      const provider = window.ethereum;
      await ensureHederaTestnet(provider);
      const [from] = await provider.request({ method: "eth_requestAccounts" });

      const to = "0x96e51caadac0f4ccc74a204fd6e07dade6b32710";
      if (!to || !to.startsWith("0x") || to.length !== 42) {
        throw new Error("Invalid escrow contract address.");
      }

      const amountHBAR = String((order as any).totalAmount ?? "0");
      const value = toWeiHex(amountHBAR);

      setPaying(true);
      const txHashLocal: string = await provider.request({
        method: "eth_sendTransaction",
        params: [{ from, to, value }],
      });
      setTxHash(txHashLocal);
    } catch (e: any) {
      setPayError(e?.message || "Payment failed.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Upload center */}
      <div className="xl:col-span-3">
        <DocumentCenter order={order} documents={documents} onUploadDoc={onUploadDoc} onDeleteDoc={onDeleteDoc} />
      </div>

      {/* Main Order Info */}
      <div className="xl:col-span-2 space-y-6">
        <Card className="glass border-border/50 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{(order as any).code}</h2>
              <p className="text-sm text-muted-foreground">
                {itemsCount} item{itemsCount > 1 ? "s" : ""} in this order
              </p>
            </div>
            <Badge variant="outline" className={`${getStatusColor((order as any).status)}`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {labelFor((order as any).status)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-semibold">{money((order as any).subtotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shipping</p>
              <p className="font-semibold">{money((order as any).shipping)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold ">{money((order as any).totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="font-semibold">
                {(order as any).progress}%
                {(loadingDetail as any) && <span className="text-xs text-muted-foreground ml-2">(updating…)</span>}
              </p>
            </div>
          </div>

          <Progress value={(order as any).progress} className="mb-4" />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Ordered: {(order as any).orderDate ? new Date((order as any).orderDate).toLocaleString() : "—"}</span>
            <span>Est. Delivery: {(order as any).estimatedDelivery ?? "—"}</span>
          </div>
        </Card>

        <Card className="glass border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          <div className="divide-y">
            {(order.items || []).map((it: any) => {
              const product: any = it.product || {};
              const name = product?.name ?? "Product";
              const unit = product?.unit ? ` ${product.unit}` : "";
              const imgUrl = pickFirstImageUrl(product?.images);

              const qty = toNumber(it.quantity, 0);
              const unitPrice = toNumber(it.unitPrice, 0);
              const lineTotal = toNumber(it.lineTotal, qty * unitPrice);

              return (
                <div key={it.id} className="py-4 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden">
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: <span className="font-medium">{qty}{unit}</span> · Unit: <span className="font-medium">{money(unitPrice)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Line Total</p>
                    <p className="font-semibold">{money(lineTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{money((order as any).subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">{money((order as any).shipping)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{money((order as any).totalAmount)}</span>
            </div>
          </div>

          <style jsx global>{`
            @keyframes blink {
              0% { opacity: 1; }
              50% { opacity: 0.4; }
              100% { opacity: 1; }
            }
            .blink {
              animation: blink 1s infinite;
            }
          `}</style>

          <div className="text-center space-y-2">
            <Button
              variant="default"
              disabled={paying}
              className={`cursor-pointer bg-green-600/60 text-lg rounded-xl ${paying ? "blink" : ""}`}
              onClick={handlePay}
            >
              <HandCoins className="w-6 h-6 mr-3" />
              {paying ? "Processing..." : "Proceed to Pay"}
            </Button>

            {txHash && (
              <p className="text-sm">
                Payment sent:{" "}
                <a className="underline" href={`https://hashscan.io/testnet/tx/${txHash}`} target="_blank" rel="noreferrer">
                  View on HashScan
                </a>
              </p>
            )}
            {payError && <p className="text-xs text-destructive">{payError}</p>}
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="glass border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Hedera Escrow Details
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Escrow Amount</p>
              <p className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">{money((order as any).totalAmount, 6)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Payment Schedule</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>On Bank Approval:</span>
                  <span className="font-medium">{(order as any).paymentSchedule.onApproval}%</span>
                </div>
                <div className="flex justify-between">
                  <span>On Shipment:</span>
                  <span className="font-medium text-yellow-500">{(order as any).paymentSchedule.onShipment}%</span>
                </div>
                <div className="flex justify-between">
                  <span>On Delivery:</span>
                  <span className="font-medium text-green-600">{(order as any).paymentSchedule.onDelivery}%</span>
                </div>
              </div>
            </div>

            {(order as any).escrowContract && (
              <div>
                <p className="text-sm text-muted-foreground">Hedera Contract</p>
                <p className="font-mono text-sm break-all">{(order as any).escrowContract}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Escrow Status</p>
              <div className="flex items-center gap-2">
                {false ? (
                  <>
                    <Lock className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Funds Secured & Active</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-500">Pending Bank Approval</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

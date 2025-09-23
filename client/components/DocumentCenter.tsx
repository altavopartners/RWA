"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Download, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { Order } from "./OrderFlow";

// ===== API base (local copy) =====
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/$/, "");

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
  documents?: DocumentItem[];
  onUploadDoc?: (file: File, meta: { categoryKey: string; typeKey: string; orderId: string }) => Promise<DocumentItem>;
  onDeleteDoc?: (doc: DocumentItem) => Promise<void>;
};

// ===== Document taxonomy (local to DocumentCenter) =====
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

// ===== Badges (local to DocumentCenter) =====
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

// ===== Auth helpers (local) =====
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

export default function DocumentCenter({
  order,
  documents = [],
  onUploadDoc,
  onDeleteDoc,
}: Props) {
  const [categoryKey, setCategoryKey] = useState("commercial");
  const [typeKey, setTypeKey] = useState(DOC_CATEGORIES[0].docs[0].key);
  const [busy, setBusy] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- local state + resync without infinite loop
  const [localDocs, setLocalDocs] = useState<DocumentItem[]>(() => documents ?? []);
  const prevDocsRef = useRef<DocumentItem[] | null>(null);

  function shallowEqualDocs(a?: DocumentItem[] | null, b?: DocumentItem[] | null) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
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
                              {has
                                ? `${list.length} file${list.length > 1 ? "s" : ""}`
                                : d.required
                                ? "Required"
                                : "Optional"}
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

"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Download, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { Order } from "./OrderFlow";

// ===== API base =====
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/$/, "");

// ===== Domain types =====
type CategoryKey = "commercial" | "transport" | "insurance" | "origin_control" | "other";
type DocTypeKey =
  | "commercial_invoice"
  | "packing_list"
  | "bill_of_lading"
  | "air_waybill"
  | "cmr"
  | "fcr"
  | "insurance_policy"
  | "certificate_of_origin"
  | "inspection_certificate"
  | "sanitary_certificate";

// Infos de doc affichées dans l’UI
export type DocumentItem = {
  id: string;
  fileName: string;
  url: string;
  size?: number;
  uploadedAt?: string;
  categoryKey: string; // côté UI on accepte string pour tolérer l’API
  typeKey: string;
  status?: "uploaded" | "verified" | "rejected" | "pending";
};

type Props = {
  order: Order;
  documents?: DocumentItem[];
  onUploadDoc?: (
    file: File,
    meta: { categoryKey: string; typeKey: string; orderId: string }
  ) => Promise<DocumentItem>;
  onDeleteDoc?: (doc: DocumentItem) => Promise<void>;
};

// ===== Taxonomy (typée correctement, plus de 'required' error) =====
type DocDef = { key: DocTypeKey; label: string; required?: boolean };
type DocCategory = { key: CategoryKey; label: string; docs: DocDef[] };

const DOC_CATEGORIES: DocCategory[] = [
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
    default:
      return <Badge variant="secondary" className="bg-green-200">Uploaded</Badge>;
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

// ===== Mapping util: API -> DocumentItem =====
function normalizeDoc(row: any): DocumentItem {
  return {
    id: row?.id ?? row?.pk ?? crypto.randomUUID(),
    fileName: row?.fileName ?? row?.filename ?? row?.name ?? "document",
    url: row?.url ?? row?.path ?? "",
    size: row?.size ?? row?.bytes ?? undefined,
    uploadedAt: row?.uploadedAt ?? row?.createdAt ?? row?.created_at ?? new Date().toISOString(),
    categoryKey: row?.categoryKey ?? row?.category ?? row?.category_key ?? "",
    typeKey: row?.typeKey ?? row?.documentType ?? row?.type_key ?? "",
    status: row?.status ?? row?.review_status ?? "uploaded",
  };
}

// ===== API fetch helper =====
async function fetchDocumentsForOrder(orderId: string, token?: string | null): Promise<DocumentItem[]> {
  if (!orderId) return [];
  //const headers = { ...authHeaderFrom(token) };

  try {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null

    const res = await fetch(`${API_BASE}/api/orders/get-my-order/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json();
      const arr = Array.isArray(data.order) ? data.order : data.order?.documents || [];
      return arr.map(normalizeDoc);
    }
  } catch {
    // try next url
  }
  return [];
}

export default function DocumentCenter({
  order,
  documents = [],
  onUploadDoc,
  onDeleteDoc,
}: Props) {
  // === States (typage corrigé) ===
  const [categoryKey, setCategoryKey] = useState<CategoryKey>("commercial");
  const [typeKey, setTypeKey] = useState<DocTypeKey>("commercial_invoice");
  const [busy, setBusy] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref déclarée UNE SEULE fois (plus d’erreur de redéclaration)
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Source de vérité UI
  const [localDocs, setLocalDocs] = useState<DocumentItem[]>(() => (documents ?? []).map(normalizeDoc));

  // Token + orderId
  const token = useReactiveToken("jwtToken");
  const orderId = String((order as any)?.id || (order as any)?.orderId || "");

  // Re-fetch on mount / orderId / token change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const serverDocs = await fetchDocumentsForOrder(orderId, token);
      if (!cancelled) setLocalDocs(serverDocs);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, token]);

  // Sync si le parent passe des documents (SSR)
  useEffect(() => {
    if (documents?.length) setLocalDocs(documents.map(normalizeDoc));
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

  const currentCat = useMemo<DocCategory>(() => {
    return DOC_CATEGORIES.find((c) => c.key === categoryKey) ?? DOC_CATEGORIES[0];
  }, [categoryKey]);

  // URL helper
  const toHref = (u: string) => {
    if (!u) return "#";
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return u.startsWith("/") ? `${API_BASE}${u}` : `${API_BASE}/${u}`;
  };

  // === Upload ===
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
        saved = await onUploadDoc(file, { categoryKey, typeKey, orderId });
      } else {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("categoryKey", categoryKey);
        fd.append("typeKey", typeKey);
        fd.append("orderId", orderId);

        const res = await fetch(`${API_BASE}/api/documents/upload`, {
          method: "POST",
          body: fd,
          headers: { ...authHeaderFrom(token) },
        });

        if (!res.ok) {
          let message = `Upload failed (${res.status})`;
          try {
            const data = await res.json();
            message = data?.message || data?.error || message;
          } catch {}
          throw new Error(message);
        }

        const raw = await res.json();
        saved = normalizeDoc(raw);
      }

      if (saved) {
        // Optimiste
        setLocalDocs((prev) => [saved!, ...prev]);
        // Puis vérité serveur
        const refreshed = await fetchDocumentsForOrder(orderId, token);
        setLocalDocs(refreshed);
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
      // séquentiel pour garder l’ordre et la lisibilité des erreurs
      // (peut être parallélisé si besoin)
      // eslint-disable-next-line no-await-in-loop
      await doUpload(f);
    }
  };

  // === DnD & pick & paste ===
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (busy) return;

    const picked: File[] = [];
    const dt = e.dataTransfer;
    if (dt.items?.length) {
      for (const item of Array.from(dt.items)) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) picked.push(f);
        }
      }
    } else if (dt.files?.length) {
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
    if (files?.length) await handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
              const ck = e.target.value as CategoryKey;
              setCategoryKey(ck);
              const first = (DOC_CATEGORIES.find((c) => c.key === ck) ?? DOC_CATEGORIES[0]).docs[0]?.key;
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
            onChange={(e) => setTypeKey(e.target.value as DocTypeKey)}
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
                          {has ? (
                            statusBadge(firstStatus)
                          ) : (
                            <Badge variant="outline" className="border-dashed">
                              Missing
                            </Badge>
                          )}
                          {has && (
                            <div className="flex items-center gap-1">
                              {list.map((doc) => (
                                <a
                                  key={doc.id}
                                  href={toHref(doc.url)}
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
                                    const refreshed = await fetchDocumentsForOrder(orderId, token);
                                    setLocalDocs(refreshed);
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

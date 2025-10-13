"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BankHeader } from "@/components/bank-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Building2,
  User,
  Calendar,
} from "lucide-react";

/**
 * =============================
 * API URL & TYPES
 * =============================
 */
//const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/bank/"; // <-- set in .env
const API_URL = "http://localhost:4000/api/bank/"; // <-- set in .env

export type DocumentRow = {
  id: string;
  orderId: string;
  clientId: string;
  clientName: string;
  clientType: "Producer" | "Buyer" | string;
  type: keyof typeof documentTypes | string; // server enum or key
  documentCid?: string | null; // ipfs hash (optional)
  status: "Pending" | "Validated" | "Rejected" | string;
  uploadedAt: string;
  validatedBy?: string | null;
  validatedAt?: string | null;
  rejectionReason?: string | null;
  fileSize?: string | number | null;
  fileName: string;
  downloadUrl?: string | null; // server-provided URL
};

export type PaginatedResponse<T> = { data: T[]; page: number; pageSize: number; total: number };
export type DocumentsQuery = {
  search?: string;
  status?: "all" | "pending" | "validated" | "rejected";
  type?: string | "all";
  page?: number;
  pageSize?: number;
};

export type ValidateBody = { action: "validate" | "reject"; reason?: string };

export type DocumentsStats = {
  total: number;
  pending: number;
  validated: number;
  rejected: number;
  byType?: Record<string, number>;
};

/**
 * =============================
 * DOCUMENT TYPE MAP (UI only)
 * =============================
 */
export const documentTypes = {
  CoO: { label: "Certificate of Origin", color: "bg-chart-1" },
  SanitaryCert: { label: "Sanitary Certificate", color: "bg-chart-2" },
  Insurance: { label: "Insurance Policy", color: "bg-chart-3" },
  Invoice: { label: "Commercial Invoice", color: "bg-chart-4" },
  CustomsPapers: { label: "Customs Papers", color: "bg-chart-5" },
} as const;

/**
 * =============================
 * API HELPERS
 * =============================
 */
function normalize(row: any): DocumentRow {
  // map flexible backend fields -> UI shape
  return {
    id: String(row.id ?? row.pk ?? crypto.randomUUID()),
    orderId: String(row.orderId ?? row.order_id ?? row.orderCode ?? row.order_code ?? ""),
    clientId: String(row.clientId ?? row.client_id ?? ""),
    clientName: String(row.clientName ?? row.client_name ?? row.client ?? "Client"),
    clientType: String(row.clientType ?? row.client_type ?? "Producer"),
    type: String(row.type ?? row.documentType ?? row.doc_type ?? "Invoice"),
    documentCid: row.documentCid ?? row.cid ?? row.ipfsHash ?? null,
    status: (
      row.status ?? row.review_status ?? "Pending"
    ) as DocumentRow["status"],
    uploadedAt: String(row.uploadedAt ?? row.createdAt ?? row.created_at ?? new Date().toISOString()),
    validatedBy: row.validatedBy ?? row.reviewedBy ?? null,
    validatedAt: row.validatedAt ?? row.reviewedAt ?? null,
    rejectionReason: row.rejectionReason ?? row.reason ?? null,
    fileSize: row.fileSize ?? row.size ?? null,
    fileName: String(row.fileName ?? row.filename ?? row.name ?? "document.pdf"),
    downloadUrl: row.downloadUrl ?? row.url ?? row.path ?? null,
  };
}

async function fetchDocuments(q: DocumentsQuery, signal?: AbortSignal): Promise<PaginatedResponse<DocumentRow>> {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.type && q.type !== "all") params.set("type", q.type);
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));

  const res = await fetch(`${API_URL}/documents?${params.toString()}`, { signal, credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch documents (${res.status})`);
  }
  const json = await res.json();
  const rows = (Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []) as any[];
  const page = json.page ?? 1;
  const pageSize = json.pageSize ?? rows.length;
  const total = json.total ?? rows.length;
  return { data: rows.map(normalize), page, pageSize, total };
}

async function fetchDocStats(signal?: AbortSignal): Promise<DocumentsStats> {
  const res = await fetch(`${API_URL}/documents/stats`, { signal, credentials: "include" });
  if (!res.ok) {
    return { total: 0, pending: 0, validated: 0, rejected: 0, byType: {} };
  }
  return res.json();
}

async function postValidate(id: string, body: ValidateBody): Promise<DocumentRow> {
  const res = await fetch(`${API_URL}/documents/${encodeURIComponent(id)}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return normalize(json?.data ?? json);
}

/**
 * =============================
 * UI HELPERS
 * =============================
 */
function getStatusBadge(status: string) {
  switch (status) {
    case "Validated":
      return (
        <Badge className="bg-chart-5 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Validated
        </Badge>
      );
    case "Pending":
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "Rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}


/**
 * =============================
 * PREVIEW & VALIDATION DIALOGS
 * =============================
 */
function DocumentPreviewDialog({ document }: { document: DocumentRow }) {
  const href = document.downloadUrl
    ? document.downloadUrl.startsWith("http")
      ? document.downloadUrl
      : `${API_URL.replace(/\/$/, "")}/${document.downloadUrl.replace(/^\//, "")}`
    : undefined;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Document Preview</DialogTitle>
          <DialogDescription>Review document details and metadata</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Document Type</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-3 h-3 rounded-full ${(documentTypes as any)[document.type]?.color ?? "bg-muted"}`} />
                <span className="text-sm">{(documentTypes as any)[document.type]?.label ?? document.type}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">File Name</Label>
              <p className="text-sm mt-1 truncate" title={document.fileName}>{document.fileName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Client</Label>
              <div className="flex items-center gap-2 mt-1">
                {document.clientType === "Producer" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span className="text-sm">{document.clientName}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Order ID</Label>
              <p className="text-sm font-mono mt-1">{document.orderId}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Upload Date</Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{new Date(document.uploadedAt).toLocaleString()}</span>
            </div>
          </div>

          {document.documentCid && (
            <div>
              <Label className="text-sm font-medium">IPFS Hash</Label>
              <p className="text-sm font-mono mt-1 bg-muted p-2 rounded break-all">{document.documentCid}</p>
            </div>
          )}

          {document.status === "Rejected" && document.rejectionReason && (
            <div>
              <Label className="text-sm font-medium">Rejection Reason</Label>
              <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-sm">{document.rejectionReason}</p>
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Document Preview</p>
                <p className="text-xs">{document.fileName}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button asChild variant="outline" disabled={!href}>
            <a href={href} target="_blank" rel="noreferrer">
              <Download className="w-4 h-4 mr-2" /> Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentValidationDialog({
  document,
  onValidate,
  pending,
}: {
  document: DocumentRow;
  onValidate: (action: ValidateBody["action"], reason?: string) => void;
  pending: boolean;
}) {
  const [action, setAction] = useState<"validate" | "reject" | "">("");
  const [reason, setReason] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (!action) return;
    onValidate(action, action === "reject" ? reason : undefined);
    setIsOpen(false);
    setAction("");
    setReason("");
  };

  const disabled = document.status !== "Pending" || pending;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (pending ? null : setIsOpen(o))}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          {document.status === "Pending" ? "Validate" : "Reviewed"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Document Validation</DialogTitle>
          <DialogDescription>Review and validate or reject this document submission.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${(documentTypes as any)[document.type]?.color ?? "bg-muted"}`} />
              <div>
                <p className="font-medium">{(documentTypes as any)[document.type]?.label ?? document.type}</p>
                <p className="text-sm text-muted-foreground">{document.fileName}</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="action">Validation Decision</Label>
            <Select value={action} onValueChange={(v) => setAction(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select validation decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="validate">Validate Document</SelectItem>
                <SelectItem value="reject">Reject Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === "reject" && (
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Provide detailed reason for rejection..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          {action === "validate" && (
            <div className="p-3 bg-chart-5/10 border border-chart-5/20 rounded">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-chart-5" />
                <p className="text-sm">This document will be marked as validated and logged to Hedera Consensus Service.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !action || (action === "reject" && !reason)}>
            {pending ? "Submitting..." : "Submit Validation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * =============================
 * MAIN PAGE (dynamic)
 * =============================
 */
export default function DocumentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 350);
  const [statusFilter, setStatusFilter] = useState<DocumentsQuery["status"]>("all");
  const [typeFilter, setTypeFilter] = useState<string | "all">("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const docsKey = useMemo(
    () => ["documents", { search: debouncedSearch, status: statusFilter, type: typeFilter, page, pageSize }],
    [debouncedSearch, statusFilter, typeFilter, page, pageSize]
  );

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: docsKey,
    queryFn: ({ signal }) =>
      fetchDocuments({ search: debouncedSearch, status: statusFilter, type: typeFilter, page, pageSize }, signal),
    placeholderData: (prev) => prev,
  });

  const statsQuery = useQuery({
    queryKey: ["documents-stats"],
    queryFn: ({ signal }) => fetchDocStats(signal),
    staleTime: 30_000,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const validateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ValidateBody }) => postValidate(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: docsKey });
      const previous = qc.getQueryData<PaginatedResponse<DocumentRow>>(docsKey);
      if (previous) {
        const optimistic = { ...previous };
        optimistic.data = previous.data.map((d) => {
          if (d.id !== id) return d;
          if (body.action === "validate") {
            return { ...d, status: "Validated", validatedBy: "Compliance", validatedAt: new Date().toISOString(), rejectionReason: null };
          }
          return { ...d, status: "Rejected", validatedBy: "Compliance", validatedAt: new Date().toISOString(), rejectionReason: body.reason ?? "" };
        });
        qc.setQueryData(docsKey, optimistic);
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(docsKey, ctx.previous);
      toast({ title: "Validation failed", description: (err as Error).message, variant: "destructive" });
    },
    onSuccess: (updated) => {
      qc.setQueryData<PaginatedResponse<DocumentRow>>(docsKey, (prev) => {
        if (!prev) return prev as any;
        return { ...prev, data: prev.data.map((d) => (d.id === updated.id ? updated : d)) };
      });
      toast({ title: "Document updated", description: `${updated.fileName} → ${updated.status}` });
      qc.invalidateQueries({ queryKey: ["documents-stats"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: docsKey }),
  });

  const handleValidation = (id: string, action: ValidateBody["action"], reason?: string) => {
    validateMutation.mutate({ id, body: { action, reason } });
  };

  // Derived counts by type using stats if available, else compute from current page
  const byType = useMemo(() => {
    return (
      statsQuery.data?.byType ||
      rows.reduce<Record<string, number>>((acc, d) => {
        const k = String(d.type);
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {})
    );
  }, [statsQuery.data?.byType, rows]);

  return (
    <div className="space-y-6 p-6">
      <BankHeader title="Document Validation" description="Review and validate trade documents from clients" />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsQuery.data?.total ?? total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{statsQuery.data?.pending ?? "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{statsQuery.data?.validated ?? "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statsQuery.data?.rejected ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Document Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Document Validation Queue</CardTitle>
          <CardDescription>Review and validate uploaded trade documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="queue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="queue">Validation Queue</TabsTrigger>
              <TabsTrigger value="types">By Document Type</TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="space-y-4">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by client, filename, or order ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as DocumentsQuery["status"]); setPage(1); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(documentTypes).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Documents Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      [...Array(6)].map((_, i) => (
                        <TableRow key={`sk-${i}`}>
                          <TableCell colSpan={6}>
                            <div className="h-10 animate-pulse bg-muted rounded" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {!isLoading && rows.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${(documentTypes as any)[document.type]?.color ?? "bg-muted"}`} />
                            <div>
                              <div className="font-medium">{(documentTypes as any)[document.type]?.label ?? document.type}</div>
                              <div className="text-sm text-muted-foreground">{document.fileName}</div>
                              {document.fileSize && (
                                <div className="text-xs text-muted-foreground">{String(document.fileSize)}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {document.clientType === "Producer" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            <div>
                              <div className="font-medium">{document.clientName}</div>
                              <div className="text-sm text-muted-foreground">{document.clientType}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{document.orderId}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(document.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(document.uploadedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(document.uploadedAt).toLocaleTimeString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DocumentPreviewDialog document={document} />
                            <DocumentValidationDialog
                              document={document}
                              onValidate={(action, reason) => handleValidation(document.id, action, reason)}
                              pending={validateMutation.isPending}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!isLoading && rows.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No documents found matching your criteria.</div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {isFetching
                    ? "Refreshing…"
                    : `Showing ${(rows.length && (page - 1) * pageSize + 1) || 0}-${(page - 1) * pageSize + rows.length} of ${total}`}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isFetching}>
                    Prev
                  </Button>
                  <div className="text-sm self-center">Page {page} / {totalPages}</div>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isFetching}>
                    Next
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {(error as Error).message}
                </div>
              )}
            </TabsContent>

            <TabsContent value="types" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(documentTypes).map(([key, type]) => (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                        {type.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{byType?.[key] ?? 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {/* If you need pending-by-type, add a dedicated stats field or filter rows here */}
                        Documents total for this type
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * =============================
 * NOTES / BACKEND CONTRACT
 * =============================
 * 1) Endpoints used:
 *    - GET  /documents?search=&status=&type=&page=&pageSize= -> { data: DocumentRow[], page, pageSize, total }
 *    - GET  /documents/stats -> { total, pending, validated, rejected, byType? }
 *    - POST /documents/:id/validate { action: "validate"|"reject", reason? } -> DocumentRow (updated)
 *
 * 2) If your API exposes different paths, swap the three helpers: fetchDocuments, fetchDocStats, postValidate.
 *
 * 3) The Preview dialog uses `downloadUrl` when provided (falls back to API_URL prefix if relative).
 *
 * 4) Add auth headers or cookies as needed; requests send credentials: 'include'.
 *
 * 5) Wrap your app with React Query Provider + Toaster (see earlier pages for snippet).
 */

// Small helper (placed last to keep file tidy)
function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

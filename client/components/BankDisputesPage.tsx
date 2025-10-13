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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Search, Eye, Scale, Clock, CheckCircle, Building2, User, FileText, Calendar, AlertTriangle, Gavel } from "lucide-react";

/**
 * =============================
 * API URL & TYPES
 * =============================
 */
//const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/bank/"; // <-- set in .env
const API_URL = "http://localhost:4000/api/bank/"; // <-- set in .env

export type Evidence = {
  id: string;
  submittedBy: "Buyer" | "Producer" | string;
  documentCid?: string | null;
  description?: string | null;
  createdAt: string;
  fileName?: string | null;
  downloadUrl?: string | null;
};

export type Ruling = {
  id: string;
  arbitratorId: string;
  arbitratorName: string;
  ruling: "PartialRefund" | "FullRefund" | "ReleaseFunds" | string;
  amount?: number | null;
  reasoning: string;
  createdAt: string;
};

export type Dispute = {
  id: string;
  orderId: string;
  initiatedBy: "Buyer" | "Producer" | string;
  reason: string;
  status: "Open" | "UnderReview" | "Resolved" | string;
  priority: "High" | "Medium" | "Low" | string;
  amount: number;
  currency: string;
  createdAt: string;
  producer: { name: string; type?: string };
  buyer: { name: string; type?: string };
  evidence: Evidence[];
  rulings: Ruling[];
};

export type PaginatedResponse<T> = { data: T[]; page: number; pageSize: number; total: number };
export type DisputesQuery = {
  search?: string;
  status?: "all" | "open" | "underreview" | "resolved";
  priority?: "all" | "high" | "medium" | "low";
  page?: number;
  pageSize?: number;
};

export type RuleBody = { ruling: "PartialRefund" | "FullRefund" | "ReleaseFunds"; amount?: number | null; reasoning: string };

export type DisputesStats = {
  total: number;
  open: number;
  underreview: number;
  resolved: number;
  atStakeHBAR?: number;
};

/**
 * =============================
 * NORMALIZER & API HELPERS
 * =============================
 */
function normalizeDispute(row: any): Dispute {
  return {
    id: String(row.id ?? row.pk ?? crypto.randomUUID()),
    orderId: String(row.orderId ?? row.order_id ?? row.orderCode ?? ""),
    initiatedBy: String(row.initiatedBy ?? row.initiator ?? "Buyer"),
    reason: String(row.reason ?? row.description ?? ""),
    status: String(row.status ?? "Open"),
    priority: String(row.priority ?? "Medium"),
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "HBAR"),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    producer: { name: String(row.producer?.name ?? row.producer_name ?? ""), type: row.producer?.type ?? "Producer" },
    buyer: { name: String(row.buyer?.name ?? row.buyer_name ?? ""), type: row.buyer?.type ?? "Buyer" },
    evidence: (row.evidence ?? []).map((e: any) => ({
      id: String(e.id ?? crypto.randomUUID()),
      submittedBy: String(e.submittedBy ?? e.by ?? e.role ?? "Buyer"),
      documentCid: e.documentCid ?? e.cid ?? e.ipfsHash ?? null,
      description: e.description ?? e.note ?? null,
      createdAt: String(e.createdAt ?? e.created_at ?? new Date().toISOString()),
      fileName: e.fileName ?? e.filename ?? null,
      downloadUrl: e.downloadUrl ?? e.url ?? e.path ?? null,
    })),
    rulings: (row.rulings ?? []).map((r: any) => ({
      id: String(r.id ?? crypto.randomUUID()),
      arbitratorId: String(r.arbitratorId ?? r.arb_id ?? ""),
      arbitratorName: String(r.arbitratorName ?? r.arb_name ?? "Arbitrator"),
      ruling: String(r.ruling ?? r.decision ?? "PartialRefund"),
      amount: r.amount ?? null,
      reasoning: String(r.reasoning ?? r.reason ?? ""),
      createdAt: String(r.createdAt ?? r.created_at ?? new Date().toISOString()),
    })),
  } as Dispute;
}

async function fetchDisputes(q: DisputesQuery, signal?: AbortSignal): Promise<PaginatedResponse<Dispute>> {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.priority && q.priority !== "all") params.set("priority", q.priority);
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));

  const res = await fetch(`${API_URL}/disputes?${params.toString()}`, { signal, credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  const rows = (Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []) as any[];
  const page = json.page ?? 1;
  const pageSize = json.pageSize ?? rows.length;
  const total = json.total ?? rows.length;
  return { data: rows.map(normalizeDispute), page, pageSize, total };
}

async function fetchDisputeStats(signal?: AbortSignal): Promise<DisputesStats> {
  const res = await fetch(`${API_URL}/disputes/stats`, { signal, credentials: "include" });
  if (!res.ok) return { total: 0, open: 0, underreview: 0, resolved: 0, atStakeHBAR: 0 };
  return res.json();
}

async function postRuling(id: string, body: RuleBody): Promise<Dispute> {
  const res = await fetch(`${API_URL}/disputes/${encodeURIComponent(id)}/ruling`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return normalizeDispute(json?.data ?? json);
}

/**
 * =============================
 * UI HELPERS
 * =============================
 */
function getStatusBadge(status: string) {
  switch (status) {
    case "Open":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Open
        </Badge>
      );
    case "UnderReview":
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Under Review
        </Badge>
      );
    case "Resolved":
      return (
        <Badge className="bg-chart-5 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolved
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "High":
      return <Badge variant="destructive">High</Badge>;
    case "Medium":
      return <Badge variant="outline">Medium</Badge>;
    case "Low":
      return <Badge variant="secondary">Low</Badge>;
    default:
      return <Badge variant="secondary">{priority}</Badge>;
  }
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * =============================
 * DIALOGS
 * =============================
 */
function DisputeDetailsDialog({ dispute }: { dispute: Dispute }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Dispute Review - {dispute.orderId}</DialogTitle>
          <DialogDescription>Complete dispute details and evidence timeline</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence ({dispute.evidence.length})</TabsTrigger>
            {dispute.rulings.length > 0 && <TabsTrigger value="rulings">Rulings</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Dispute Amount</Label>
                <p className="text-lg font-semibold mt-1">
                  {dispute.amount.toLocaleString()} {dispute.currency}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <div className="mt-1">{getPriorityBadge(dispute.priority)}</div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Dispute Reason</Label>
              <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{dispute.reason}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Parties Involved</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">{dispute.producer.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Producer</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{dispute.buyer.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                  {dispute.initiatedBy === "Buyer" && (
                    <Badge variant="outline" className="mt-1 text-xs">Dispute Initiator</Badge>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Timeline</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Dispute opened: {new Date(dispute.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Evidence submissions: {dispute.evidence.length}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evidence">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {dispute.evidence.map((evidence, index) => {
                  const href = evidence.downloadUrl
                    ? evidence.downloadUrl.startsWith("http")
                      ? evidence.downloadUrl
                      : `${API_URL.replace(/\/$/, "")}/${evidence.downloadUrl.replace(/^\//, "")}`
                    : undefined;
                  return (
                    <div key={evidence.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {evidence.submittedBy === "Producer" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            <span className="font-medium">{evidence.submittedBy}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">Evidence #{index + 1}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{new Date(evidence.createdAt).toLocaleString()}</div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm">{evidence.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          <span>{evidence.fileName}</span>
                          {evidence.documentCid && (
                            <>
                              <span>•</span>
                              <span className="font-mono break-all">{evidence.documentCid}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button asChild variant="outline" size="sm" disabled={!href}>
                          <a href={href} target="_blank" rel="noreferrer">View Document</a>
                        </Button>
                        <Button asChild variant="ghost" size="sm" disabled={!href}>
                          <a href={href} target="_blank" rel="noreferrer">Download</a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {dispute.rulings.length > 0 && (
            <TabsContent value="rulings">
              <div className="space-y-4">
                {dispute.rulings.map((ruling) => (
                  <div key={ruling.id} className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Gavel className="w-4 h-4" />
                        <span className="font-medium">Arbitration Ruling</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{new Date(ruling.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <Label className="text-xs">Ruling</Label>
                          <p className="text-sm font-medium">{ruling.ruling.replace(/([A-Z])/g, " $1").trim()}</p>
                        </div>
                        {typeof ruling.amount === "number" && (
                          <div>
                            <Label className="text-xs">Amount</Label>
                            <p className="text-sm font-medium">{ruling.amount.toLocaleString()} HBAR</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Reasoning</Label>
                        <p className="text-sm mt-1">{ruling.reasoning}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Arbitrator</Label>
                        <p className="text-sm">{ruling.arbitratorName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ArbitrationDialog({ dispute, onRule, pending }: { dispute: Dispute; onRule: (ruling: RuleBody) => void; pending: boolean }) {
  const [ruling, setRuling] = useState<"PartialRefund" | "FullRefund" | "ReleaseFunds" | "">("");
  const [amount, setAmount] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    const body: RuleBody = { ruling: ruling as any, amount: ruling === "FullRefund" ? dispute.amount : amount ? Number(amount) : null, reasoning };
    onRule(body);
    setIsOpen(false);
    setRuling("");
    setAmount("");
    setReasoning("");
  };

  const isResolved = dispute.status === "Resolved";

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (pending ? null : setIsOpen(o))}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isResolved || pending}>
          {isResolved ? "Resolved" : "Issue Ruling"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Issue Arbitration Ruling</DialogTitle>
          <DialogDescription>Make a binding decision on this trade dispute</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Dispute Amount</span>
              <span className="text-lg font-semibold">{dispute.amount.toLocaleString()} {dispute.currency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Initiated by</span>
              <span className="text-sm">{dispute.initiatedBy}</span>
            </div>
          </div>

          <Alert>
            <Scale className="h-4 w-4" />
            <AlertDescription>
              Your arbitration ruling will be final and recorded on the Hedera blockchain. This decision cannot be reversed.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="ruling">Arbitration Decision</Label>
            <Select value={ruling} onValueChange={(v) => setRuling(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your ruling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PartialRefund">Partial Refund to Buyer</SelectItem>
                <SelectItem value="FullRefund">Full Refund to Buyer</SelectItem>
                <SelectItem value="ReleaseFunds">Release Funds to Producer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(ruling === "PartialRefund" || ruling === "FullRefund") && (
            <div>
              <Label htmlFor="amount">{ruling === "FullRefund" ? "Full Refund Amount" : "Refund Amount"}</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder={ruling === "FullRefund" ? dispute.amount.toString() : "Enter amount..."}
                  value={ruling === "FullRefund" ? dispute.amount.toString() : amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={ruling === "FullRefund"}
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{dispute.currency}</div>
              </div>
              {ruling === "PartialRefund" && (
                <p className="text-xs text-muted-foreground mt-1">Maximum: {dispute.amount.toLocaleString()} {dispute.currency}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="reasoning">Arbitration Reasoning</Label>
            <Textarea
              id="reasoning"
              placeholder="Provide detailed reasoning for your decision..."
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>

          {ruling && (
            <div className="p-3 border rounded-lg bg-accent/10">
              <div className="flex items-center gap-2 mb-2">
                <Gavel className="w-4 h-4 text-accent" />
                <span className="font-medium">Ruling Summary</span>
              </div>
              <p className="text-sm">
                {ruling === "PartialRefund" && `Partial refund of ${amount || "X"} ${dispute.currency} to buyer`}
                {ruling === "FullRefund" && `Full refund of ${dispute.amount.toLocaleString()} ${dispute.currency} to buyer`}
                {ruling === "ReleaseFunds" && `Release full amount of ${dispute.amount.toLocaleString()} ${dispute.currency} to producer`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !ruling || !reasoning}>
            {pending ? "Submitting…" : "Issue Final Ruling"}
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
export default function BankDisputesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 350);
  const [statusFilter, setStatusFilter] = useState<DisputesQuery["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<DisputesQuery["priority"]>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const disputesKey = useMemo(
    () => ["disputes", { search: debouncedSearch, status: statusFilter, priority: priorityFilter, page, pageSize }],
    [debouncedSearch, statusFilter, priorityFilter, page, pageSize]
  );

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: disputesKey,
    queryFn: ({ signal }) => fetchDisputes({ search: debouncedSearch, status: statusFilter, priority: priorityFilter, page, pageSize }, signal),
    keepPreviousData: true,
  });

  const statsQuery = useQuery({
    queryKey: ["disputes-stats"],
    queryFn: ({ signal }) => fetchDisputeStats(signal),
    staleTime: 30_000,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const ruleMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RuleBody }) => postRuling(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: disputesKey });
      const previous = qc.getQueryData<PaginatedResponse<Dispute>>(disputesKey);
      if (previous) {
        const optimistic: PaginatedResponse<Dispute> = { ...previous };
        optimistic.data = previous.data.map((d) => {
          if (d.id !== id) return d;
          const newRuling: Ruling = {
            id: crypto.randomUUID(),
            arbitratorId: "ARB-SELF",
            arbitratorName: "Current Arbitrator",
            ruling: body.ruling,
            amount: body.amount ?? null,
            reasoning: body.reasoning,
            createdAt: new Date().toISOString(),
          };
          return { ...d, status: "Resolved", rulings: [...(d.rulings || []), newRuling] };
        });
        qc.setQueryData(disputesKey, optimistic);
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(disputesKey, ctx.previous);
      toast({ title: "Ruling failed", description: (err as Error).message, variant: "destructive" });
    },
    onSuccess: (updated) => {
      qc.setQueryData<PaginatedResponse<Dispute>>(disputesKey, (prev) => {
        if (!prev) return prev as any;
        return { ...prev, data: prev.data.map((d) => (d.id === updated.id ? updated : d)) };
      });
      toast({ title: "Ruling recorded", description: `${updated.orderId} → ${updated.status}` });
      qc.invalidateQueries({ queryKey: ["disputes-stats"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: disputesKey }),
  });

  const statusCounts = useMemo(() => {
    const s = statsQuery.data;
    if (s) return s;
    const counts: DisputesStats = { total: rows.length, open: 0, underreview: 0, resolved: 0, atStakeHBAR: 0 };
    for (const d of rows) {
      if (d.status === "Open") counts.open++;
      else if (d.status === "UnderReview") counts.underreview++;
      else if (d.status === "Resolved") counts.resolved++;
      if (d.status !== "Resolved") counts.atStakeHBAR! += d.amount;
    }
    return counts;
  }, [statsQuery.data, rows]);

  return (
    <div className="space-y-6 p-6">
      <BankHeader title="Dispute Resolution" description="Arbitrate trade disputes and issue binding rulings" />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground">{(statusCounts.atStakeHBAR || 0).toLocaleString()} HBAR at stake</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusCounts.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{statusCounts.underreview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{statusCounts.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Dispute Management */}
      <Card>
        <CardHeader>
          <CardTitle>Arbitration Dashboard</CardTitle>
          <CardDescription>Review disputes and issue binding arbitration rulings</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by order ID, parties, or reason..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as DisputesQuery["status"]); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="underreview">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v as DisputesQuery["priority"]); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Disputes Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={8}>
                        <div className="h-10 animate-pulse bg-muted rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {!isLoading && rows.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm">{dispute.orderId}</div>
                        <div className="text-sm text-muted-foreground">{dispute.reason}</div>
                        <div className="text-xs text-muted-foreground">by {dispute.initiatedBy}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm"><Building2 className="w-3 h-3" /><span>{dispute.producer.name}</span></div>
                        <div className="flex items-center gap-2 text-sm"><User className="w-3 h-3" /><span>{dispute.buyer.name}</span></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{dispute.amount.toLocaleString()} {dispute.currency}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{dispute.evidence.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(dispute.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DisputeDetailsDialog dispute={dispute} />
                        <ArbitrationDialog dispute={dispute} onRule={(body) => ruleMutation.mutate({ id: dispute.id, body })} pending={ruleMutation.isPending} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="text-center py-8 text-muted-foreground">No disputes found matching your criteria.</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {isFetching ? "Refreshing…" : `Showing ${(rows.length && (page - 1) * pageSize + 1) || 0}-${(page - 1) * pageSize + rows.length} of ${total}`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isFetching}>Prev</Button>
              <div className="text-sm self-center">Page {page} / {totalPages}</div>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isFetching}>Next</Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{(error as Error).message}</div>
          )}
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
 *    - GET  /disputes?search=&status=&priority=&page=&pageSize= -> { data: Dispute[], page, pageSize, total }
 *    - GET  /disputes/stats -> { total, open, underreview, resolved, atStakeHBAR }
 *    - POST /disputes/:id/ruling { ruling, amount?, reasoning } -> Dispute (updated)
 *
 * 2) Evidence preview links use `downloadUrl` when provided (absolute or relative to NEXT_PUBLIC_API_URL).
 *
 * 3) Add auth headers globally if required; these requests send credentials: 'include'.
 *
 * 4) Wrap your app with React Query Provider + Toaster.
 */
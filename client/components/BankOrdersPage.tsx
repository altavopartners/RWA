"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  Shield,
  Truck,
  DollarSign,
} from "lucide-react";

/**
 * =============================
 * API URL & TYPES
 * =============================
 */
//const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/bank/"; // <-- set in .env
const API_URL = "http://localhost:4000/api/bank/"; // <-- set in .env

type Party = { name: string; avatar?: string | null; bank: string };
export type Order = {
  id: string;
  buyer: Party;
  seller: Party;
  product: string;
  amount: number;
  escrowAmount: number;
  status: "pending_bank_approval" | "document_review" | "in_shipment" | "completed" | "disputed" | string;
  buyerBankStatus: "approved" | "pending" | "rejected" | string;
  sellerBankStatus: "approved" | "pending" | "rejected" | string;
  documentsSubmitted: number;
  documentsRequired: number;
  createdAt: string;
  estimatedCompletion: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type OrdersQuery = {
  search?: string;
  status?: "all" | Order["status"];
  page?: number;
  pageSize?: number;
};

export type OrderActionBody = {
  action: "approve" | "reject" | "request_documents";
  reason?: string;
};

export type OrdersStats = {
  pendingApproval: number;
  inReview: number;
  activeEscrows: number;
  totalValue: number; // in same currency as order.amount
  deltaPending?: number; // optional: +/– vs yesterday
  deltaReview?: number;
  deltaEscrows?: number;
  deltaValuePct?: number; // +% vs last month
};

/**
 * =============================
 * API HELPERS
 * =============================
 */
async function fetchOrders(q: OrdersQuery, signal?: AbortSignal): Promise<PaginatedResponse<Order>> {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));

  const res = await fetch(`${API_URL}/orders?${params.toString()}`, { signal, credentials: "include" });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

async function fetchOrderStats(signal?: AbortSignal): Promise<OrdersStats> {
  const res = await fetch(`${API_URL}/orders/stats`, { signal, credentials: "include" });
  if (!res.ok) {
    // Fallback to zeros so UI still renders
    return { pendingApproval: 0, inReview: 0, activeEscrows: 0, totalValue: 0 };
  }
  return res.json();
}

async function postOrderAction(id: string, body: OrderActionBody): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${id}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * =============================
 * UI HELPERS
 * =============================
 */
const statusMeta: Record<string, { label: string; icon: JSX.Element; className: string }> = {
  pending_bank_approval: {
    label: "pending bank approval",
    icon: <Clock className="h-4 w-4" />,
    className: "bg-amber-100 text-amber-900 border border-amber-200",
  },
  document_review: {
    label: "document review",
    icon: <FileText className="h-4 w-4" />,
    className: "bg-slate-200 text-slate-900 border border-slate-300",
  },
  in_shipment: {
    label: "in shipment",
    icon: <Truck className="h-4 w-4" />,
    className: "bg-sky-100 text-sky-900 border border-sky-200",
  },
  completed: {
    label: "completed",
    icon: <CheckCircle className="h-4 w-4" />,
    className: "bg-emerald-100 text-emerald-900 border border-emerald-200",
  },
  disputed: {
    label: "disputed",
    icon: <XCircle className="h-4 w-4" />,
    className: "bg-red-100 text-red-900 border border-red-200",
  },
};

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? {
    label: status.replaceAll("_", " "),
    icon: <AlertCircle className="h-4 w-4" />,
    className: "bg-slate-200 text-slate-900 border border-slate-300",
  };
  return (
    <Badge variant="secondary" className={`flex items-center gap-1 ${meta.className}`}>
      {meta.icon}
      {meta.label}
    </Badge>
  );
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
 * MAIN PAGE (dynamic)
 * =============================
 */
export default function BankOrdersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // local filters
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<OrdersQuery["status"]>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const ordersKey = useMemo(
    () => ["orders", { search: debouncedSearch, status: statusFilter, page, pageSize }],
    [debouncedSearch, statusFilter, page, pageSize]
  );

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ordersKey,
    queryFn: ({ signal }) => fetchOrders({ search: debouncedSearch, status: statusFilter, page, pageSize }, signal),
    keepPreviousData: true,
  });

  const statsQuery = useQuery({
    queryKey: ["orders-stats"],
    queryFn: ({ signal }) => fetchOrderStats(signal),
    staleTime: 30_000,
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const actionMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: OrderActionBody }) => postOrderAction(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: ordersKey });
      const previous = qc.getQueryData<PaginatedResponse<Order>>(ordersKey);
      if (previous) {
        const optimistic: PaginatedResponse<Order> = {
          ...previous,
          data: previous.data.map((o) => {
            if (o.id !== id) return o;
            if (body.action === "approve" && o.status === "pending_bank_approval") {
              return { ...o, status: "document_review" };
            }
            if (body.action === "reject") {
              return { ...o, status: "disputed" };
            }
            // request_documents keeps same status but maybe adjust counts later
            return o;
          }),
        };
        qc.setQueryData(ordersKey, optimistic);
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(ordersKey, ctx.previous);
      toast({ title: "Action failed", description: (err as Error).message, variant: "destructive" });
    },
    onSuccess: (updated) => {
      // replace with server version
      qc.setQueryData<PaginatedResponse<Order>>(ordersKey, (prev) => {
        if (!prev) return prev as any;
        return { ...prev, data: prev.data.map((o) => (o.id === updated.id ? updated : o)) };
      });
      toast({ title: "Order updated", description: `${updated.id} → ${updated.status}` });
      qc.invalidateQueries({ queryKey: ["orders-stats"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ordersKey });
    },
  });

  const handleApproveOrder = (orderId: string) =>
    actionMutation.mutate({ id: orderId, body: { action: "approve" } });
  const handleRejectOrder = (orderId: string) =>
    actionMutation.mutate({ id: orderId, body: { action: "reject" } });
  const handleRequestDocuments = (orderId: string) =>
    actionMutation.mutate({ id: orderId, body: { action: "request_documents" } });

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">Review and approve trade orders requiring bank verification</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsQuery.data?.pendingApproval ?? "—"}</div>
            <p className="text-xs text-muted-foreground">{formatDelta(statsQuery.data?.deltaPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsQuery.data?.inReview ?? "—"}</div>
            <p className="text-xs text-muted-foreground">{formatDelta(statsQuery.data?.deltaReview)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Escrows</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsQuery.data?.activeEscrows ?? "—"}</div>
            <p className="text-xs text-muted-foreground">{formatDelta(statsQuery.data?.deltaEscrows)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statsQuery.data?.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {statsQuery.data?.deltaValuePct != null ? `${statsQuery.data.deltaValuePct > 0 ? "+" : ""}${statsQuery.data.deltaValuePct}% from last month` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as OrdersQuery["status"]);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending_bank_approval">Pending Approval</SelectItem>
            <SelectItem value="document_review">Document Review</SelectItem>
            <SelectItem value="in_shipment">In Shipment</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Orders</CardTitle>
          <CardDescription>Orders requiring bank verification and approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && [...Array(5)].map((_, i) => (
              <div key={`skeleton-${i}`} className="h-24 rounded-lg border bg-muted animate-pulse" />
            ))}

            {!isLoading && orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <Avatar className="border-2 border-background">
                      <AvatarImage src={order.buyer?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{initials(order.buyer?.name)}</AvatarFallback>
                    </Avatar>
                    <Avatar className="border-2 border-background">
                      <AvatarImage src={order.seller?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{initials(order?.seller?.name)}</AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.code}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{order.product}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Buyer: {order.buyer?.name} ({order.buyer?.bank})
                      </span>
                      <span>
                        Seller: {order.seller?.name} ({order.seller?.bank})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right min-w-[120px]">
                    <div className="font-medium">{formatCurrency(order.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      Docs: {order.documentsSubmitted}/{order.documentsRequired}
                    </div>
                    <Progress
                      value={(order.documentsSubmitted / order.documentsRequired) * 100}
                      className="w-28 h-2 mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span>Buyer Bank:</span>
                      <Badge
                        variant={order.buyerBankStatus === "approved" ? "secondary" : order.buyerBankStatus === "pending" ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {order.buyerBankStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Seller Bank:</span>
                      <Badge
                        variant={order.sellerBankStatus === "approved" ? "secondary" : order.sellerBankStatus === "pending" ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {order.sellerBankStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {/* open details drawer/modal here */}}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.status === "pending_bank_approval" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveOrder(order.id)}
                          className="text-green-600 hover:text-green-700"
                          disabled={actionMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectOrder(order.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={actionMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {order.documentsSubmitted < order.documentsRequired && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestDocuments(order.id)}
                        disabled={actionMutation.isPending}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!isLoading && orders.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                No orders found for this filter.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {isFetching
                ? "Refreshing…"
                : `Showing ${(orders.length && (page - 1) * pageSize + 1) || 0}-${(page - 1) * pageSize + orders.length} of ${total}`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                Prev
              </Button>
              <div className="text-sm self-center">Page {page} / {totalPages}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
              >
                Next
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {(error as Error).message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * =============================
 * UTILS
 * =============================
 */
function initials(name: string) {
  return name
}

function formatCurrency(value?: number) {
  if (value == null) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDelta(v?: number) {
  if (v == null) return "";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v} from yesterday`;
}

/**
 * =============================
 * NOTES / BACKEND CONTRACT
 * =============================
 * 1) Endpoints used:
 *    - GET  /orders?search=&status=&page=&pageSize= -> { data: Order[], page, pageSize, total }
 *    - GET  /orders/stats -> { pendingApproval, inReview, activeEscrows, totalValue, delta*? }
 *    - POST /orders/:id/action { action: "approve"|"reject"|"request_documents", reason? } -> Order (updated)
 *      (If your backend uses /approve, /reject, /request-docs paths, swap postOrderAction accordingly.)
 *
 * 2) Optimistic updates:
 *    - approve: pending_bank_approval → document_review (adjust if your workflow differs)
 *    - reject: → disputed
 *    - request_documents: no status change client-side
 *
 * 3) Add a details Drawer/Dialog wired to the Eye button if you have an order-details endpoint.
 *
 * 4) Remember to wrap your app with React Query Provider & Toaster (see Clients page notes).
 */

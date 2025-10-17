"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BankHeader } from "@/components/bank-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast"; // ensure shadcn toast is installed; else swap to any toast lib
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  User,
} from "lucide-react";

/**
 * =============================
 * API TYPES & HELPERS
 * =============================
 */

//const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/bank/"; // <-- set in .env
const API_URL = "http://localhost:4000/api/bank/"; // <-- set in .env

export type Client = {
  id: string;
  name: string;
  email: string;
  type: "Producer" | "Buyer";
  hederaId: string;
  bankId: string;
  kycStatus: "Pending" | "Verified" | "Expired" | "Rejected" | string;
  kycExpiry: string | null;
  createdAt: string;
  lastActivity: string;
  orderCount: number;
  totalVolume: number;
};

export type ClientsQuery = {
  search?: string;
  status?: "all" | "pending" | "verified" | "expired" | "rejected";
  page?: number;
  pageSize?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

async function fetchClients(q: ClientsQuery, signal?: AbortSignal): Promise<PaginatedResponse<Client>> {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));

  const res = await fetch(`${API_URL}/clients?${params.toString()}`, { signal, credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch clients (${res.status})`);
  }
  return res.json();
}

export type KycAction = {
  action: "approve" | "reject" | "request_info";
  reason?: string;
};

async function postKycAction(clientId: string, body: KycAction): Promise<Client> {
  const res = await fetch(`${API_URL}/clients/${clientId}/kyc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to submit KYC action (${res.status})`);
  }
  return res.json();
}

/**
 * =============================
 * UI HELPERS
 * =============================
 */

function getKycStatusBadge(status: string) {
  switch (status) {
    case "Verified":
      return (
        <Badge className="bg-chart-5 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    case "Pending":
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "Expired":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expired
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
 * Debounce a primitive value
 */
function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * =============================
 * KYC ACTION DIALOG
 * =============================
 */
function KycActionDialog({
  client,
  onAction,
  pending,
}: {
  client: Client;
  onAction: (action: KycAction) => void;
  pending: boolean;
}) {
  const [action, setAction] = useState<KycAction["action"] | "">("");
  const [reason, setReason] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const reset = () => {
    setAction("");
    setReason("");
  };

  const handleSubmit = () => {
    if (!action) return;
    onAction({ action, reason: action !== "approve" ? reason : undefined });
    setIsOpen(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (pending ? null : setIsOpen(o))}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          <Eye className="w-4 h-4 mr-1" />
          Review KYC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>KYC Review - {client.name}</DialogTitle>
          <DialogDescription>
            Review and approve or reject the KYC application for this client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Client Type</Label>
              <div className="flex items-center gap-2 mt-1">
                {client.type === "Producer" ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm">{client.type}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Hedera ID</Label>
              <p className="text-sm font-mono mt-1">{client.hederaId}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="mt-1">{getKycStatusBadge(client.kycStatus)}</div>
          </div>

          <div>
            <Label className="text-sm font-medium">Trading History</Label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-sm font-medium">{client.orderCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Volume</p>
                <p className="text-sm font-medium">${client?.totalVolume?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="action">Action</Label>
            <Select value={action} onValueChange={(v) => setAction(v as KycAction["action"]) }>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve KYC</SelectItem>
                <SelectItem value="reject">Reject KYC</SelectItem>
                <SelectItem value="request_info">Request Additional Information</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(action === "reject" || action === "request_info") && (
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Provide reason for rejection or additional information needed..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pending || !action || (action !== "approve" && !reason)}
          >
            {pending ? "Submitting..." : "Submit Review"}
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
export default function BankClientsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // local UI state (synced to URL could be added later)
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 350);
  const [statusFilter, setStatusFilter] = useState<ClientsQuery["status"]>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10; // tune as needed

  const queryKey = useMemo(
    () => [
      "clients",
      { search: debouncedSearch, status: statusFilter, page, pageSize },
    ],
    [debouncedSearch, statusFilter, page, pageSize]
  );

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      fetchClients(
        { search: debouncedSearch, status: statusFilter, page, pageSize },
        signal
      ),
    staleTime:5000,
  });

  const clients = data?.data ?? [];

  const statusCounts = useMemo(() => {
    // if your backend exposes a `/clients/stats` endpoint, replace this with that call
    const counts = clients.reduce(
      (acc, c) => {
        acc.all += 1;
        const s = c.kycStatus?.toLowerCase();
        if (s in acc) (acc as any)[s] += 1;
        return acc;
      },
      { all: 0, pending: 0, verified: 0, expired: 0, rejected: 0 }
    );
    return counts;
  }, [clients]);

  const kycMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: KycAction }) => postKycAction(id, body),
    // optimistic update
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<PaginatedResponse<Client>>(queryKey);
      if (previous) {
        const nextData = { ...previous };
        nextData.data = previous.data.map((c) => {
          if (c.id !== id) return c;
          if (body.action === "approve") {
            const nextExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0];
            return { ...c, kycStatus: "Verified", kycExpiry: nextExpiry };
          }
          if (body.action === "reject") {
            return { ...c, kycStatus: "Rejected", kycExpiry: null };
          }
          return c; // request_info doesn't change status here
        });
        qc.setQueryData(queryKey, nextData);
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
      toast({ title: "KYC action failed", description: (err as Error).message, variant: "destructive" });
    },
    onSuccess: (updated) => {
      // Replace updated row
      qc.setQueryData<PaginatedResponse<Client>>(queryKey, (prev) => {
        if (!prev) return prev as any;
        return { ...prev, data: prev.data.map((c) => (c.id === updated.id ? updated : c)) };
      });
      toast({ title: "KYC updated", description: `Status for ${updated.name} set to ${updated.kycStatus}` });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const handleKycAction = (clientId: string, body: KycAction) => {
    kycMutation.mutate({ id: clientId, body });
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 p-6">
      <BankHeader
        title="Client Management"
        description="Manage KYC validation and client compliance status"
      />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{statusCounts.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{statusCounts.verified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusCounts.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusCounts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>Review and manage KYC status for all assigned clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as ClientsQuery["status"]);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clients Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Trading Activity</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell colSpan={7}>
                        <div className="h-8 animate-pulse bg-muted rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {!isLoading && clients.map((client) => (
                  <TableRow key={client.id} className={kycMutation.isPending ? "opacity-90" : ""}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                        <div className="text-xs text-muted-foreground font-mono">{client.hederaId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {client.type === "Producer" ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        {client.type}
                      </div>
                    </TableCell>
                    <TableCell>{getKycStatusBadge(client.kycStatus)}</TableCell>
                    <TableCell>
                      {client.kycExpiry ? (
                        <div className="text-sm">{new Date(client.kycExpiry).toLocaleDateString()}</div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{client.orderCount} orders</div>
                        <div className="text-muted-foreground">${client?.totalVolume?.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(client.lastActivity).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <KycActionDialog
                        client={client}
                        onAction={(payload) => handleKycAction(client.id, payload)}
                        pending={kycMutation.isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}

                {!isLoading && clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="text-center py-8 text-muted-foreground">
                        No clients found matching your criteria.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {isFetching ? "Refreshing…" : `Showing ${(clients.length && (page - 1) * pageSize + 1) || 0}-${(page - 1) * pageSize + clients.length} of ${total}`}
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
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * =============================
 * NOTES / INTEGRATION CHECKLIST
 * =============================
 * 1) Add React Query provider in your root layout:
 *
 *   // app/providers.tsx
 *   "use client";
 *   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 *   import { Toaster } from "@/components/ui/toaster"; // shadcn toast
 *   export default function Providers({ children }: { children: React.ReactNode }) {
 *     const [client] = React.useState(() => new QueryClient());
 *     return (
 *       <QueryClientProvider client={client}>
 *         {children}
 *         <Toaster />
 *       </QueryClientProvider>
 *     );
 *   }
 *
 *   // app/layout.tsx
 *   import Providers from "./providers";
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html lang="en">
 *         <body>
 *           <Providers>{children}</Providers>
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * 2) Expose your backend:
 *    - .env.local => NEXT_PUBLIC_API_URL=https://your-api.example.com
 *
 * 3) Backend expectations used here:
 *    - GET  /clients?search=&status=&page=&pageSize= -> { data: Client[], page, pageSize, total }
 *    - POST /clients/:id/kyc { action: "approve"|"reject"|"request_info", reason? } -> Client (updated)
 *
 * 4) Replace statusCounts with a dedicated stats endpoint if available (e.g., GET /clients/stats).
 *
 * 5) Security: this sample sends credentials: 'include'. Adjust CORS and cookies/JWT per your setup.
 */

"use client";

import { useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Building2,
  User,
  Key,
  Lock,
  Unlock,
  Truck,
  FileCheck,
} from "lucide-react";

/**
 * =============================
 * API URL & TYPES
 * =============================
 */
//const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/bank/"; // <-- set in .env
const API_URL = "http://localhost:4000/api/bank/"; // <-- set in .env

export type BankApproval = {
  bankId: string;
  bankName: string;
  role: "buyer_bank" | "seller_bank";
  documentsReceived: boolean;
  documentsVerified: boolean;
  approved: boolean | null; // null = not yet
  signature?: string;
  signedAt?: string;
  signedBy?: string;
  notes?: string;
};

export type Escrow = {
  id: string;
  orderId: string;
  contractAddress: string;
  clientId: string;
  clientName: string;
  clientType: "Buyer" | "Seller" | string;
  counterpartyName: string;
  counterpartyBank: string;
  productName: string;
  quantity: string;
  amount: number;
  currency: string;
  status:
    | "Pending Documents"
    | "Ready for Shipment"
    | "In Transit"
    | "Delivered"
    | "Compliance Hold"
    | string;
  releaseConditions: string;
  createdAt: string;
  expiresAt: string;
  documentStatus?: {
    buyerDocuments: "pending" | "submitted" | "verified" | "rejected";
    sellerDocuments: "pending" | "submitted" | "verified" | "rejected";
    buyerBank: string;
    sellerBank: string;
  };
  paymentSchedule: { onShipment: number; onDelivery: number };
  approvals: BankApproval[];
};

export type PaginatedResponse<T> = { data: T[]; page: number; pageSize: number; total: number };
export type EscrowsQuery = {
  search?: string;
  status?: "all" | "pending" | "ready" | "transit" | "delivered" | "held";
  page?: number;
  pageSize?: number;
};

export type EscrowActionBody = {
  action:
    | "verify_docs"
    | "reject_docs"
    | "request_more"
    | "approve"
    | "reject"
    | "hold";
  reason?: string;
  privateKey?: string; // when action = approve (final)
};

export type EscrowStats = {
  total: number;
  pending: number;
  ready: number;
  transit: number;
  delivered: number;
  held: number;
  totalValue: number;
  pendingValue?: number;
};

/**
 * =============================
 * API HELPERS
 * =============================
 */
function normalize(row: any): Escrow {
  return {
    id: String(row.id ?? row.pk ?? crypto.randomUUID()),
    orderId: String(row.orderId ?? row.order_id ?? row.orderCode ?? ""),
    contractAddress: String(row.contractAddress ?? row.contract_address ?? row.hederaId ?? ""),
    clientId: String(row.clientId ?? row.client_id ?? ""),
    clientName: String(row.clientName ?? row.client_name ?? row.client ?? ""),
    clientType: String(row.clientType ?? row.client_type ?? "Buyer"),
    counterpartyName: String(row.counterpartyName ?? row.counterparty ?? ""),
    counterpartyBank: String(row.counterpartyBank ?? row.counterparty_bank ?? ""),
    productName: String(row.productName ?? row.product ?? ""),
    quantity: String(row.quantity ?? row.qty ?? ""),
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "USD"),
    status: String(row.status ?? "Pending Documents"),
    releaseConditions: String(row.releaseConditions ?? row.conditions ?? ""),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    expiresAt: String(row.expiresAt ?? row.expires_at ?? new Date().toISOString()),
    documentStatus: row.documentStatus ?? row.doc_status ?? undefined,
    paymentSchedule: row.paymentSchedule ?? { onShipment: 50, onDelivery: 50 },
    approvals: (row.approvals ?? []).map((a: any) => ({
      bankId: String(a.bankId ?? a.bank_id ?? ""),
      bankName: String(a.bankName ?? a.bank_name ?? ""),
      role: (a.role ?? "buyer_bank") as BankApproval["role"],
      documentsReceived: Boolean(a.documentsReceived ?? a.docs_received ?? false),
      documentsVerified: Boolean(a.documentsVerified ?? a.docs_verified ?? false),
      approved: a.approved ?? null,
      signature: a.signature ?? "",
      signedAt: a.signedAt ?? "",
      signedBy: a.signedBy ?? "",
      notes: a.notes ?? "",
    })),
  };
}

async function fetchEscrows(q: EscrowsQuery, signal?: AbortSignal): Promise<PaginatedResponse<Escrow>> {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));

  const res = await fetch(`${API_URL}/escrows?${params.toString()}`, { signal, credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  const rows = (Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []) as any[];
  const page = json.page ?? 1;
  const pageSize = json.pageSize ?? rows.length;
  const total = json.total ?? rows.length;
  return { data: rows.map(normalize), page, pageSize, total };
}

async function fetchEscrowStats(signal?: AbortSignal): Promise<EscrowStats> {
  const res = await fetch(`${API_URL}/escrows/stats`, { signal, credentials: "include" });
  if (!res.ok) return { total: 0, pending: 0, ready: 0, transit: 0, delivered: 0, held: 0, totalValue: 0 };
  return res.json();
}

async function postEscrowAction(id: string, body: EscrowActionBody): Promise<Escrow> {
  const res = await fetch(`${API_URL}/escrows/${encodeURIComponent(id)}/action`, {
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
    case "Ready for Shipment":
      return (
        <Badge className="bg-chart-5 text-white">
          <Unlock className="w-3 h-3 mr-1" />
          Ready for Shipment
        </Badge>
      );
    case "Pending Documents":
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Pending Documents
        </Badge>
      );
    case "In Transit":
      return (
        <Badge className="bg-chart-3 text-white">
          <Truck className="w-3 h-3 mr-1" />
          In Transit
        </Badge>
      );
    case "Delivered":
      return (
        <Badge className="bg-chart-1 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Delivered
        </Badge>
      );
    case "Compliance Hold":
      return (
        <Badge variant="destructive">
          <Lock className="w-3 h-3 mr-1" />
          Compliance Hold
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getApprovalProgress(approvals: BankApproval[]) {
  const buyerBank = approvals.find((a) => a.role === "buyer_bank");
  const sellerBank = approvals.find((a) => a.role === "seller_bank");

  let progress = 0;
  let status = "Awaiting Documents";

  if (buyerBank?.documentsReceived && sellerBank?.documentsReceived) {
    progress = 25;
    status = "Documents Received";
  }
  if (buyerBank?.documentsVerified && sellerBank?.documentsVerified) {
    progress = 50;
    status = "Documents Verified";
  }
  if (buyerBank?.approved === true && sellerBank?.approved === true) {
    progress = 100;
    status = "Both Banks Approved";
  } else if (buyerBank?.approved === true || sellerBank?.approved === true) {
    progress = 75;
    status = "Partial Approval";
  }
  if (buyerBank?.approved === false || sellerBank?.approved === false) {
    progress = 0;
    status = "Approval Rejected";
  }

  return {
    progress,
    status,
    buyerBankReady: buyerBank?.approved === true,
    sellerBankReady: sellerBank?.approved === true,
    bothBanksApproved: buyerBank?.approved === true && sellerBank?.approved === true,
    documentsComplete: !!(buyerBank?.documentsVerified && sellerBank?.documentsVerified),
  };
}

/**
 * =============================
 * DIALOGS
 * =============================
 */
function EscrowDetailsDialog({ escrow }: { escrow: Escrow }) {
  const approvalStats = getApprovalProgress(escrow.approvals);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Escrow Contract Details</DialogTitle>
          <DialogDescription>Review escrow terms and dual-bank approval workflow</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Contract Address</Label>
              <p className="text-sm font-mono mt-1 bg-muted p-2 rounded">{escrow.contractAddress}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Order ID</Label>
              <p className="text-sm font-mono mt-1">{escrow.orderId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Product</Label>
              <p className="text-sm mt-1 font-medium">{escrow.productName}</p>
              <p className="text-xs text-muted-foreground">{escrow.quantity}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Payment Schedule</Label>
              <div className="text-sm mt-1 space-y-1">
                <div className="flex justify-between">
                  <span>On Shipment:</span>
                  <span className="font-medium">
                    {escrow.paymentSchedule.onShipment}% ($
                    {((escrow.amount * escrow.paymentSchedule.onShipment) / 100).toLocaleString()})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>On Delivery:</span>
                  <span className="font-medium">
                    {escrow.paymentSchedule.onDelivery}% ($
                    {((escrow.amount * escrow.paymentSchedule.onDelivery) / 100).toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Total Escrow Amount</Label>
              <p className="text-lg font-semibold mt-1">${escrow.amount.toLocaleString()} {escrow.currency}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Expires</Label>
              <p className="text-sm mt-1">{new Date(escrow.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Trading Parties & Banks</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {escrow.clientType === "Seller" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  <span className="font-medium">{escrow.clientName}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{escrow.clientType}</p>
                <p className="text-xs text-muted-foreground">
                  Bank: {
                    escrow.approvals.find((a) => a.role === `${escrow.clientType.toLowerCase()}_bank`)?.bankName.split(" (")[0]
                  }
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">{escrow.counterpartyName}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{escrow.clientType === "Buyer" ? "Seller" : "Buyer"}</p>
                <p className="text-xs text-muted-foreground">Bank: {escrow.counterpartyBank}</p>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Release Conditions</Label>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{escrow.releaseConditions}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Dual Bank Approval Workflow</Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{approvalStats.status}</span>
                <Badge variant={approvalStats.bothBanksApproved ? "default" : "secondary"}>
                  {approvalStats.bothBanksApproved ? "Ready to Release" : "Pending Approval"}
                </Badge>
              </div>
              <Progress value={approvalStats.progress} className="h-2" />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Bank Document Verification & Approval</Label>
            <div className="mt-2 space-y-2">
              {escrow.approvals.map((approval, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {approval.documentsVerified ? (
                        approval.approved === true ? (
                          <CheckCircle className="w-4 h-4 text-chart-5" />
                        ) : approval.approved === false ? (
                          <XCircle className="w-4 h-4 text-destructive" />
                        ) : (
                          <Clock className="w-4 h-4 text-warning" />
                        )
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <span className="font-medium">{approval.bankName}</span>
                        <div className="text-xs text-muted-foreground">
                          Docs: {approval.documentsReceived ? (approval.documentsVerified ? "Verified" : "Under Review") : "Pending"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {approval.signedAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">{new Date(approval.signedAt).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{approval.signedBy}</p>
                      </div>
                    )}
                    {approval.notes && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-48 text-right">{approval.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">View on Hedera</Button>
          <Button variant="outline">Download Documents</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EscrowApprovalDialog({
  escrow,
  onApprove,
  pending,
}: {
  escrow: Escrow;
  onApprove: (action: EscrowActionBody["action"], reason?: string, privateKey?: string) => void;
  pending: boolean;
}) {
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const currentBankApproval = escrow.approvals.find((a) => a.bankId === "BNK001"); // TODO: replace by logged-in bank id
  const hasAlreadyApproved = currentBankApproval?.approved !== null;
  const documentsVerified = currentBankApproval?.documentsVerified;

  const handleSubmit = () => {
    onApprove(action as EscrowActionBody["action"], reason, privateKey);
    setIsOpen(false);
    setAction("");
    setReason("");
    setPrivateKey("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => (pending ? null : setIsOpen(o))}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={hasAlreadyApproved || pending}>
          {hasAlreadyApproved ? "Already Processed" : documentsVerified ? "Final Approval" : "Process Documents"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bank Approval Workflow</DialogTitle>
          <DialogDescription>
            {!documentsVerified ? "Verify client documents before final escrow approval" : "Provide final approval for escrow release"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Escrow Amount</span>
              <span className="text-lg font-semibold">${escrow.amount.toLocaleString()} {escrow.currency}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Product</span>
              <span className="text-sm font-medium">{escrow.productName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Client</span>
              <span className="text-sm font-medium">{escrow.clientName} ({escrow.clientType})</span>
            </div>
          </div>

          {!documentsVerified && (
            <Alert>
              <FileCheck className="h-4 w-4" />
              <AlertDescription>
                Client must submit required documents: ID verification, trade licenses, product certificates, and shipping documentation.
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Both buyer's and seller's banks must approve before funds can be released. 50% releases on shipment confirmation, 50% on delivery confirmation.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="action">Bank Decision</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select your decision" />
              </SelectTrigger>
              <SelectContent>
                {!documentsVerified ? (
                  <>
                    <SelectItem value="verify_docs">Verify Documents & Approve</SelectItem>
                    <SelectItem value="reject_docs">Reject Documents</SelectItem>
                    <SelectItem value="request_more">Request Additional Documents</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="approve">Final Approval for Release</SelectItem>
                    <SelectItem value="reject">Reject Release</SelectItem>
                    <SelectItem value="hold">Place Compliance Hold</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {action === "approve" && documentsVerified && (
            <div>
              <Label htmlFor="privateKey">Bank Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="Enter your bank's Hedera private key..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Required for cryptographic signature on Hedera network</p>
            </div>
          )}

          {(action === "reject" || action === "hold" || action === "reject_docs" || action === "request_more") && (
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder={
                  action === "reject_docs"
                    ? "Specify which documents are invalid or missing..."
                    : action === "request_more"
                    ? "Specify additional documents required..."
                    : action === "reject"
                    ? "Provide reason for rejection..."
                    : "Specify compliance concerns requiring hold..."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          {action === "approve" && (
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Your approval will enable the escrow release schedule: 50% on shipment, 50% on delivery confirmation.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              pending ||
              !action ||
              (action === "approve" && documentsVerified && !privateKey) ||
              ((action === "reject" || action === "hold" || action === "reject_docs" || action === "request_more") && !reason)
            }
          >
            {action === "approve" ? "Sign & Approve" : action === "verify_docs" ? "Verify & Approve" : "Submit Decision"}
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
export default function EscrowsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<EscrowsQuery["status"]>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const escrowsKey = useMemo(
    () => ["escrows", { search: searchTerm, status: statusFilter, page, pageSize }],
    [searchTerm, statusFilter, page, pageSize]
  );

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: escrowsKey,
    queryFn: ({ signal }) => fetchEscrows({ search: searchTerm, status: statusFilter, page, pageSize }, signal),
    keepPreviousData: true,
  });

  const statsQuery = useQuery({
    queryKey: ["escrows-stats"],
    queryFn: ({ signal }) => fetchEscrowStats(signal),
    staleTime: 30_000,
  });

  const escrows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const actionMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: EscrowActionBody }) => postEscrowAction(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: escrowsKey });
      const previous = qc.getQueryData<PaginatedResponse<Escrow>>(escrowsKey);
      if (previous) {
        const optimistic: PaginatedResponse<Escrow> = { ...previous };
        optimistic.data = previous.data.map((e) => {
          if (e.id !== id) return e;
          const approvals = e.approvals.map((a) => {
            if (a.bankId !== "BNK001") return a; // TODO: replace with real bank id
            if (body.action === "verify_docs") {
              return {
                ...a,
                documentsReceived: true,
                documentsVerified: true,
                approved: true,
                signedAt: new Date().toISOString(),
                signedBy: "Current Bank Officer",
                signature: `0x${Math.random().toString(16).slice(2, 10)}...`,
                notes: "Documents verified and approved for release",
              } as BankApproval;
            }
            if (body.action === "approve") {
              return {
                ...a,
                approved: true,
                signedAt: new Date().toISOString(),
                signedBy: "Current Bank Officer",
                signature: `0x${Math.random().toString(16).slice(2, 10)}...`,
                notes: "Final approval granted",
              } as BankApproval;
            }
            if (body.action === "reject_docs" || body.action === "reject") {
              return {
                ...a,
                approved: false,
                signedAt: new Date().toISOString(),
                signedBy: "Current Bank Officer",
                notes: body.reason || "Rejected",
              } as BankApproval;
            }
            if (body.action === "request_more") {
              return { ...a, notes: `Additional documents requested: ${body.reason || "—"}` } as BankApproval;
            }
            if (body.action === "hold") {
              return { ...a, notes: body.reason || "Compliance hold placed" } as BankApproval;
            }
            return a;
          });

          const stats = getApprovalProgress(approvals);
          let status = e.status;
          if (body.action === "hold") status = "Compliance Hold";
          else if (stats.bothBanksApproved) status = "Ready for Shipment";
          else if (body.action === "verify_docs") status = "Pending Counterparty Approval";

          return { ...e, approvals, status } as Escrow;
        });
        qc.setQueryData(escrowsKey, optimistic);
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(escrowsKey, ctx.previous);
      toast({ title: "Action failed", description: (err as Error).message, variant: "destructive" });
    },
    onSuccess: (updated) => {
      qc.setQueryData<PaginatedResponse<Escrow>>(escrowsKey, (prev) => {
        if (!prev) return prev as any;
        return { ...prev, data: prev.data.map((e) => (e.id === updated.id ? updated : e)) };
      });
      toast({ title: "Escrow updated", description: `${updated.orderId} → ${updated.status}` });
      qc.invalidateQueries({ queryKey: ["escrows-stats"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: escrowsKey }),
  });

  const handleApproval = (escrowId: string, action: EscrowActionBody["action"], reason?: string, privateKey?: string) => {
    actionMutation.mutate({ id: escrowId, body: { action, reason, privateKey } });
  };

  const statusCounts = useMemo(() => {
    const s = statsQuery.data;
    if (s) return s;
    // fallback derived from current page only (approx)
    const counts = { total: escrows.length, pending: 0, ready: 0, transit: 0, delivered: 0, held: 0, totalValue: 0 } as EscrowStats;
    for (const e of escrows) {
      counts.totalValue += e.amount;
      if (e.status.includes("Pending")) counts.pending++;
      if (e.status === "Ready for Shipment") counts.ready++;
      if (e.status === "In Transit") counts.transit++;
      if (e.status === "Delivered") counts.delivered++;
      if (e.status === "Compliance Hold") counts.held++;
    }
    return counts;
  }, [statsQuery.data, escrows]);

  return (
    <div className="space-y-6 p-6">
      <BankHeader title="Escrow Management" description="Dual-bank approval workflow for secure trade finance" />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Escrows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground">${(statusCounts.totalValue || 0).toLocaleString()} total value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{statusCounts.pending}</div>
            {typeof statusCounts.pendingValue === "number" && (
              <p className="text-xs text-muted-foreground">${statusCounts.pendingValue.toLocaleString()} pending</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{statusCounts.ready}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{statusCounts.transit}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Holds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusCounts.held}</div>
          </CardContent>
        </Card>
      </div>

      {/* Escrow Management */}
      <Card>
        <CardHeader>
          <CardTitle>Dual-Bank Escrow Workflow</CardTitle>
          <CardDescription>Both buyer's and seller's banks must approve before funds release</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by client, product, order ID, or contract address..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as EscrowsQuery["status"]); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending Documents</SelectItem>
                <SelectItem value="ready">Ready to Ship</SelectItem>
                <SelectItem value="transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="held">Compliance Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Escrows Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order & Product</TableHead>
                  <TableHead>Trading Parties</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bank Approval Progress</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={7}>
                        <div className="h-10 animate-pulse bg-muted rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {!isLoading && escrows.map((escrow) => {
                  const approvalStats = getApprovalProgress(escrow.approvals);
                  return (
                    <TableRow key={escrow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{escrow.productName}</div>
                          <div className="text-sm text-muted-foreground">{escrow.quantity}</div>
                          <div className="text-xs text-muted-foreground font-mono">{escrow.orderId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {escrow.clientType === "Seller" ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            <span className="text-sm font-medium">{escrow.clientName}</span>
                            <span className="text-xs text-muted-foreground">({escrow.clientType})</span>
                          </div>
                          <div className="text-xs text-muted-foreground">↔ {escrow.counterpartyName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">${escrow.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{escrow.paymentSchedule.onShipment}%/{escrow.paymentSchedule.onDelivery}% split</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(escrow.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{approvalStats.status}</span>
                            <Badge variant={approvalStats.bothBanksApproved ? "default" : "secondary"} className="text-xs">
                              {approvalStats.bothBanksApproved ? "Approved" : "Pending"}
                            </Badge>
                          </div>
                          <Progress value={approvalStats.progress} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(escrow.expiresAt).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EscrowDetailsDialog escrow={escrow} />
                          <EscrowApprovalDialog
                            escrow={escrow}
                            onApprove={(action, reason, pk) => handleApproval(escrow.id, action, reason, pk)}
                            pending={actionMutation.isPending}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!isLoading && escrows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="text-center py-8 text-muted-foreground">No escrows found matching your criteria.</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {isFetching ? "Refreshing…" : `Showing ${(escrows.length && (page - 1) * pageSize + 1) || 0}-${(page - 1) * pageSize + escrows.length} of ${total}`}
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
 *    - GET  /escrows?search=&status=&page=&pageSize= -> { data: Escrow[], page, pageSize, total }
 *    - GET  /escrows/stats -> { total, pending, ready, transit, delivered, held, totalValue, pendingValue? }
 *    - POST /escrows/:id/action { action, reason?, privateKey? } -> Escrow (updated)
 *
 * 2) Replace the hard-coded bankId "BNK001" with the logged-in bank's id.
 *
 * 3) Keep React Query Provider + Toaster at app root (see earlier pages).
 */

"use client";

import { useState } from "react";
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

// Mock data - in real app this would come from API
const mockEscrows = [
  {
    id: "1",
    orderId: "ORD-2024-001",
    contractAddress: "0.0.123456",
    clientId: "1",
    clientName: "ABC Trading Corp",
    clientType: "Buyer",
    counterpartyName: "Kwame Farms",
    counterpartyBank: "Ghana Commercial Bank",
    productName: "Premium Ghanaian Cocoa Beans",
    quantity: "500 kg",
    amount: 1250,
    currency: "USD",
    status: "Pending Documents",
    releaseConditions:
      "Both banks verify documents, goods shipped, delivery confirmed",
    createdAt: "2024-01-20T10:00:00Z",
    expiresAt: "2024-02-20T10:00:00Z",
    documentStatus: {
      buyerDocuments: "pending", // pending, submitted, verified, rejected
      sellerDocuments: "pending",
      buyerBank: "BNK001", // Compliance Bank Ltd
      sellerBank: "GCB001", // Ghana Commercial Bank
    },
    paymentSchedule: {
      onShipment: 50, // 50% released when both banks approve and goods ship
      onDelivery: 50, // 50% released when buyer confirms delivery
    },
    approvals: [
      {
        bankId: "BNK001",
        bankName: "Compliance Bank Ltd (Buyer's Bank)",
        role: "buyer_bank",
        documentsReceived: false,
        documentsVerified: false,
        approved: false,
        signature: "",
        signedAt: "",
        signedBy: "",
        notes: "Awaiting buyer to submit required documents",
      },
      {
        bankId: "GCB001",
        bankName: "Ghana Commercial Bank (Seller's Bank)",
        role: "seller_bank",
        documentsReceived: false,
        documentsVerified: false,
        approved: false,
        signature: "",
        signedAt: "",
        signedBy: "",
        notes: "Awaiting seller to submit required documents",
      },
    ],
  },
  {
    id: "2",
    orderId: "ORD-2024-002",
    contractAddress: "0.0.789012",
    clientId: "2",
    clientName: "Global Exports Ltd",
    clientType: "Buyer",
    counterpartyName: "Adoma Textiles",
    counterpartyBank: "Ecobank Ghana",
    productName: "Authentic Kente Cloth",
    quantity: "5 pieces",
    amount: 750,
    currency: "USD",
    status: "Ready for Shipment",
    releaseConditions: "Both banks approved, awaiting shipment confirmation",
    createdAt: "2024-01-19T09:15:00Z",
    expiresAt: "2024-02-19T09:15:00Z",
    documentStatus: {
      buyerDocuments: "verified",
      sellerDocuments: "verified",
      buyerBank: "BNK001",
      sellerBank: "ECO001",
    },
    paymentSchedule: {
      onShipment: 50,
      onDelivery: 50,
    },
    approvals: [
      {
        bankId: "BNK001",
        bankName: "Compliance Bank Ltd (Buyer's Bank)",
        role: "buyer_bank",
        documentsReceived: true,
        documentsVerified: true,
        approved: true,
        signature: "0x4d5e6f...",
        signedAt: "2024-01-19T11:20:00Z",
        signedBy: "Compliance Officer B",
        notes: "All buyer documents verified. Ready to proceed.",
      },
      {
        bankId: "ECO001",
        bankName: "Ecobank Ghana (Seller's Bank)",
        role: "seller_bank",
        documentsReceived: true,
        documentsVerified: true,
        approved: true,
        signature: "0x7g8h9i...",
        signedAt: "2024-01-19T13:45:00Z",
        signedBy: "Trade Finance Manager",
        notes: "Seller documents verified. Export permits confirmed.",
      },
    ],
  },
  {
    id: "3",
    orderId: "ORD-2024-003",
    contractAddress: "0.0.345678",
    clientId: "3",
    clientName: "Premium Commodities Inc",
    clientType: "Seller",
    counterpartyName: "European Traders SA",
    counterpartyBank: "Euro Trade Bank",
    productName: "Organic Shea Butter",
    quantity: "200 kg",
    amount: 3200,
    currency: "USD",
    status: "In Transit",
    releaseConditions: "50% released on shipment, 50% on delivery confirmation",
    createdAt: "2024-01-18T16:30:00Z",
    expiresAt: "2024-02-18T16:30:00Z",
    documentStatus: {
      buyerDocuments: "verified",
      sellerDocuments: "verified",
      buyerBank: "ETB001",
      sellerBank: "BNK001",
    },
    paymentSchedule: {
      onShipment: 50,
      onDelivery: 50,
    },
    approvals: [
      {
        bankId: "BNK001",
        bankName: "Compliance Bank Ltd (Seller's Bank)",
        role: "seller_bank",
        documentsReceived: true,
        documentsVerified: true,
        approved: true,
        signature: "0x1a2b3c...",
        signedAt: "2024-01-18T18:00:00Z",
        signedBy: "Export Finance Officer",
        notes: "Export documentation complete. Goods shipped.",
      },
      {
        bankId: "ETB001",
        bankName: "Euro Trade Bank (Buyer's Bank)",
        role: "buyer_bank",
        documentsReceived: true,
        documentsVerified: true,
        approved: true,
        signature: "0x9d8e7f...",
        signedAt: "2024-01-18T19:30:00Z",
        signedBy: "Import Compliance Manager",
        notes: "Import permits verified. Awaiting delivery confirmation.",
      },
    ],
  },
];

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

function getApprovalProgress(approvals: any[]) {
  const buyerBank = approvals.find((a) => a.role === "buyer_bank");
  const sellerBank = approvals.find((a) => a.role === "seller_bank");

  let progress = 0;
  let status = "Awaiting Documents";

  // Check document submission and verification progress
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
    bothBanksApproved:
      buyerBank?.approved === true && sellerBank?.approved === true,
    documentsComplete:
      buyerBank?.documentsVerified && sellerBank?.documentsVerified,
  };
}

function EscrowDetailsDialog({ escrow }: { escrow: any }) {
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
          <DialogDescription>
            Review escrow terms and dual-bank approval workflow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Contract Address</Label>
              <p className="text-sm font-mono mt-1 bg-muted p-2 rounded">
                {escrow.contractAddress}
              </p>
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
                    {(
                      (escrow.amount * escrow.paymentSchedule.onShipment) /
                      100
                    ).toLocaleString()}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>On Delivery:</span>
                  <span className="font-medium">
                    {escrow.paymentSchedule.onDelivery}% ($
                    {(
                      (escrow.amount * escrow.paymentSchedule.onDelivery) /
                      100
                    ).toLocaleString()}
                    )
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Total Escrow Amount</Label>
              <p className="text-lg font-semibold mt-1">
                ${escrow.amount.toLocaleString()} {escrow.currency}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Expires</Label>
              <p className="text-sm mt-1">
                {new Date(escrow.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Trading Parties */}
          <div>
            <Label className="text-sm font-medium">
              Trading Parties & Banks
            </Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {escrow.clientType === "Seller" ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="font-medium">{escrow.clientName}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {escrow.clientType}
                </p>
                <p className="text-xs text-muted-foreground">
                  Bank:{" "}
                  {
                    escrow.approvals
                      .find(
                        (a: any) =>
                          a.role === `${escrow.clientType.toLowerCase()}_bank`
                      )
                      ?.bankName.split(" (")[0]
                  }
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">{escrow.counterpartyName}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {escrow.clientType === "Buyer" ? "Seller" : "Buyer"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Bank: {escrow.counterpartyBank}
                </p>
              </div>
            </div>
          </div>

          {/* Release Conditions */}
          <div>
            <Label className="text-sm font-medium">Release Conditions</Label>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{escrow.releaseConditions}</p>
            </div>
          </div>

          {/* Dual Bank Approval Status */}
          <div>
            <Label className="text-sm font-medium">
              Dual Bank Approval Workflow
            </Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{approvalStats.status}</span>
                <Badge
                  variant={
                    approvalStats.bothBanksApproved ? "default" : "secondary"
                  }
                >
                  {approvalStats.bothBanksApproved
                    ? "Ready to Release"
                    : "Pending Approval"}
                </Badge>
              </div>
              <Progress value={approvalStats.progress} className="h-2" />
            </div>
          </div>

          {/* Bank Approvals */}
          <div>
            <Label className="text-sm font-medium">
              Bank Document Verification & Approval
            </Label>
            <div className="mt-2 space-y-2">
              {escrow.approvals.map((approval: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
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
                          Docs:{" "}
                          {approval.documentsReceived
                            ? approval.documentsVerified
                              ? "Verified"
                              : "Under Review"
                            : "Pending"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {approval.signedAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(approval.signedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {approval.signedBy}
                        </p>
                      </div>
                    )}
                    {approval.notes && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-48 text-right">
                        {approval.notes}
                      </p>
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
}: {
  escrow: any;
  onApprove: (action: string, reason?: string) => void;
}) {
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const currentBankApproval = escrow.approvals.find(
    (a: any) => a.bankId === "BNK001"
  );
  const hasAlreadyApproved = currentBankApproval?.approved !== null;
  const documentsVerified = currentBankApproval?.documentsVerified;

  const handleSubmit = () => {
    onApprove(action, reason);
    setIsOpen(false);
    setAction("");
    setReason("");
    setPrivateKey("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={hasAlreadyApproved}>
          {hasAlreadyApproved
            ? "Already Processed"
            : documentsVerified
            ? "Final Approval"
            : "Process Documents"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bank Approval Workflow</DialogTitle>
          <DialogDescription>
            {!documentsVerified
              ? "Verify client documents before final escrow approval"
              : "Provide final approval for escrow release"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Escrow Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Escrow Amount</span>
              <span className="text-lg font-semibold">
                ${escrow.amount.toLocaleString()} {escrow.currency}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Product</span>
              <span className="text-sm font-medium">{escrow.productName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Client</span>
              <span className="text-sm font-medium">
                {escrow.clientName} ({escrow.clientType})
              </span>
            </div>
          </div>

          {/* Document Status */}
          {!documentsVerified && (
            <Alert>
              <FileCheck className="h-4 w-4" />
              <AlertDescription>
                Client must submit required documents: ID verification, trade
                licenses, product certificates, and shipping documentation.
              </AlertDescription>
            </Alert>
          )}

          {/* Workflow Status */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Both buyer's and seller's banks must approve before funds can be
              released. 50% releases on shipment confirmation, 50% on delivery
              confirmation.
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
                    <SelectItem value="verify_docs">
                      Verify Documents & Approve
                    </SelectItem>
                    <SelectItem value="reject_docs">
                      Reject Documents
                    </SelectItem>
                    <SelectItem value="request_more">
                      Request Additional Documents
                    </SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="approve">
                      Final Approval for Release
                    </SelectItem>
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
              <p className="text-xs text-muted-foreground mt-1">
                Required for cryptographic signature on Hedera network
              </p>
            </div>
          )}

          {(action === "reject" ||
            action === "hold" ||
            action === "reject_docs" ||
            action === "request_more") && (
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
                Your approval will enable the escrow release schedule: 50% on
                shipment, 50% on delivery confirmation.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !action ||
              (action === "approve" && documentsVerified && !privateKey) ||
              ((action === "reject" ||
                action === "hold" ||
                action === "reject_docs" ||
                action === "request_more") &&
                !reason)
            }
          >
            {action === "approve"
              ? "Sign & Approve"
              : action === "verify_docs"
              ? "Verify & Approve"
              : "Submit Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EscrowsPage() {
  const [escrows, setEscrows] = useState(mockEscrows);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredEscrows = escrows.filter((escrow) => {
    const matchesSearch =
      escrow.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escrow.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escrow.contractAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escrow.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      escrow.status.toLowerCase().includes(statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const handleApproval = async (
    escrowId: string,
    action: string,
    reason?: string
  ) => {
    console.log(`Bank Action: ${action} for escrow ${escrowId}`, reason);

    setEscrows((prev) =>
      prev.map((escrow) => {
        if (escrow.id === escrowId) {
          const updatedApprovals = escrow.approvals.map((approval) => {
            if (approval.bankId === "BNK001") {
              let newApproval = { ...approval };

              if (action === "verify_docs") {
                newApproval = {
                  ...approval,
                  documentsReceived: true,
                  documentsVerified: true,
                  approved: true,
                  signature:
                    "0x" + Math.random().toString(16).substr(2, 8) + "...",
                  signedAt: new Date().toISOString(),
                  signedBy: "Current Bank Officer",
                  notes: "Documents verified and approved for release",
                };
              } else if (action === "approve") {
                newApproval = {
                  ...approval,
                  approved: true,
                  signature:
                    "0x" + Math.random().toString(16).substr(2, 8) + "...",
                  signedAt: new Date().toISOString(),
                  signedBy: "Current Bank Officer",
                  notes: "Final approval granted",
                };
              } else if (action === "reject_docs" || action === "reject") {
                newApproval = {
                  ...approval,
                  approved: false,
                  signature: "",
                  signedAt: new Date().toISOString(),
                  signedBy: "Current Bank Officer",
                  notes: reason || "Rejected",
                };
              } else if (action === "request_more") {
                newApproval = {
                  ...approval,
                  notes: `Additional documents requested: ${reason}`,
                };
              }

              return newApproval;
            }
            return approval;
          });

          const approvalStats = getApprovalProgress(updatedApprovals);
          let newStatus = escrow.status;

          if (action === "hold") {
            newStatus = "Compliance Hold";
          } else if (approvalStats.bothBanksApproved) {
            newStatus = "Ready for Shipment";
          } else if (action === "verify_docs") {
            newStatus = "Pending Counterparty Approval";
          }

          return {
            ...escrow,
            approvals: updatedApprovals,
            status: newStatus,
          };
        }
        return escrow;
      })
    );
  };

  const statusCounts = {
    all: escrows.length,
    pending: escrows.filter((e) => e.status.includes("Pending")).length,
    ready: escrows.filter((e) => e.status === "Ready for Shipment").length,
    transit: escrows.filter((e) => e.status === "In Transit").length,
    delivered: escrows.filter((e) => e.status === "Delivered").length,
    held: escrows.filter((e) => e.status === "Compliance Hold").length,
  };

  const totalValue = escrows.reduce((sum, escrow) => sum + escrow.amount, 0);
  const pendingValue = escrows
    .filter((e) => e.status.includes("Pending"))
    .reduce((sum, escrow) => sum + escrow.amount, 0);

  return (
    <div className="space-y-6 p-6">
      <BankHeader
        title="Escrow Management"
        description="Dual-bank approval workflow for secure trade finance"
      />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Escrows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <p className="text-xs text-muted-foreground">
              ${totalValue.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {statusCounts.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              ${pendingValue.toLocaleString()} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">
              {statusCounts.ready}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {statusCounts.transit}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Holds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {statusCounts.held}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escrow Management */}
      <Card>
        <CardHeader>
          <CardTitle>Dual-Bank Escrow Workflow</CardTitle>
          <CardDescription>
            Both buyer's and seller's banks must approve before funds release
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by client, product, order ID, or contract address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          <div className="rounded-md border">
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
                {filteredEscrows.map((escrow) => {
                  const approvalStats = getApprovalProgress(escrow.approvals);
                  return (
                    <TableRow key={escrow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {escrow.productName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {escrow.quantity}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {escrow.orderId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {escrow.clientType === "Seller" ? (
                              <Building2 className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            <span className="text-sm font-medium">
                              {escrow.clientName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({escrow.clientType})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ↔ {escrow.counterpartyName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          ${escrow.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {escrow.paymentSchedule.onShipment}%/
                          {escrow.paymentSchedule.onDelivery}% split
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(escrow.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{approvalStats.status}</span>
                            <Badge
                              variant={
                                approvalStats.bothBanksApproved
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {approvalStats.bothBanksApproved
                                ? "Approved"
                                : "Pending"}
                            </Badge>
                          </div>
                          <Progress
                            value={approvalStats.progress}
                            className="h-1"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(escrow.expiresAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EscrowDetailsDialog escrow={escrow} />
                          <EscrowApprovalDialog
                            escrow={escrow}
                            onApprove={(action, reason) =>
                              handleApproval(escrow.id, action, reason)
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredEscrows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No escrows found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

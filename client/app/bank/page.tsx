"use client";

import { ReactNode, useState } from "react";
import { BankHeader } from "@/components/bank-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  FileCheck,
  Package,
} from "lucide-react";
import { useBankData } from "@/hooks/useBankData";
import { bankApi } from "@/lib/api";
import { debug } from "@/lib/debug";
import type { BankOrder, OrderStatus } from "@/types/bank";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ------------------------------
// Status mapping
// ------------------------------
const statusColorMap: Partial<Record<OrderStatus, string>> = {
  BANK_REVIEW:
    "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
  IN_TRANSIT: "bg-[#88CEDC]/20 text-[#5BA8B8] border-[#88CEDC]/30",
  DELIVERED:
    "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
  DISPUTED: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
  CANCELLED:
    "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30",
};

const statusIconMap: Partial<Record<OrderStatus, ReactNode>> = {
  BANK_REVIEW: <FileCheck className="h-4 w-4" />,
  IN_TRANSIT: <Truck className="h-4 w-4" />,
  DELIVERED: <CheckCircle className="h-4 w-4" />,
  DISPUTED: <XCircle className="h-4 w-4" />,
  CANCELLED: <AlertCircle className="h-4 w-4" />,
};

// ------------------------------
// Workflow helpers
// ------------------------------
function getWorkflowProgress(order: BankOrder) {
  const steps: OrderStatus[] = ["BANK_REVIEW", "IN_TRANSIT", "DELIVERED"];
  const currentIndex = steps.indexOf(order.status);
  const progress =
    currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;

  return {
    progress,
    currentStep: currentIndex + 1,
    totalSteps: steps.length,
    nextAction: getNextAction(order.status),
    escrowStatus: getEscrowStatus(order.status),
  };
}

function getNextAction(status: OrderStatus) {
  switch (status) {
    case "BANK_REVIEW":
      return "Review order and approve documents";
    case "IN_TRANSIT":
      return "Order shipped - prepare for delivery";
    case "DELIVERED":
      return "Release remaining escrow to seller";
    case "DISPUTED":
      return "Resolve dispute";
    case "CANCELLED":
      return "Order cancelled";
    default:
      return "Action required";
  }
}

function getEscrowStatus(status: OrderStatus): string {
  switch (status) {
    case "BANK_REVIEW":
      return "Escrow pending bank approvals";
    case "IN_TRANSIT":
      return "50% released to seller - Awaiting delivery";
    case "DELIVERED":
      return "100% released to seller - Order complete";
    case "DISPUTED":
      return "Escrow frozen - dispute in progress";
    case "CANCELLED":
      return "Escrow refunded / order cancelled";
    default:
      return "Escrow status unknown";
  }
}

// ------------------------------
// OrderApprovalDialog with Bank Selector
// ------------------------------
function OrderApprovalDialog({
  order,
  onApprove,
  onReleaseEscrow,
  onRequestDocs,
}: {
  order: BankOrder;
  onApprove: (bankType: "buyer" | "seller") => void;
  onReleaseEscrow: () => void;
  onRequestDocs: (requestTo: "buyer" | "seller") => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<"buyer" | "seller" | "">("");
  const [isApproving, setIsApproving] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={
          order.status !== "BANK_REVIEW" && order.status !== "IN_TRANSIT"
        }
        className="border-[#88CEDC] text-[#88CEDC] hover:bg-[#88CEDC] hover:text-white"
      >
        <Shield className="h-4 w-4 mr-1" />
        {order.status === "BANK_REVIEW" ? "Approve Order" : "Process Escrow"}
      </Button>

      <DialogContent className="sm:max-w-[400px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Bank Approval / Escrow
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Step {getWorkflowProgress(order).currentStep} of{" "}
              {getWorkflowProgress(order).totalSteps} -{" "}
              {Math.round(getWorkflowProgress(order).progress)}% Complete
            </p>
            <Progress
              value={getWorkflowProgress(order).progress}
              className="h-2"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {getWorkflowProgress(order).nextAction}
            </p>
          </div>

          {order.status === "BANK_REVIEW" && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Request Documents
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isApproving}
                    onClick={async () => {
                      setIsApproving(true);
                      try {
                        onRequestDocs("buyer");
                        setIsOpen(false);
                      } finally {
                        setIsApproving(false);
                      }
                    }}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    {isApproving ? "Sending..." : "From Buyer"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isApproving}
                    onClick={async () => {
                      setIsApproving(true);
                      try {
                        onRequestDocs("seller");
                        setIsOpen(false);
                      } finally {
                        setIsApproving(false);
                      }
                    }}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    {isApproving ? "Sending..." : "From Seller"}
                  </Button>
                </div>
              </div>

              <Select
                value={selectedBank}
                onValueChange={(val) =>
                  setSelectedBank(val as "buyer" | "seller")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your bank type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">
                    Buyer Bank {order.buyerBankId ? "✓" : "(no bank assigned)"}
                  </SelectItem>
                  <SelectItem value="seller">
                    Seller Bank{" "}
                    {order.sellerBankId ? "✓" : "(no bank assigned)"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="w-full mt-2 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white"
                disabled={!selectedBank || isApproving}
                onClick={async () => {
                  setIsApproving(true);
                  try {
                    onApprove(selectedBank as "buyer" | "seller");
                    setIsOpen(false);
                  } finally {
                    setIsApproving(false);
                  }
                }}
              >
                {isApproving ? "Approving..." : "Approve Order"}
              </Button>
            </>
          )}

          {order.status === "IN_TRANSIT" && (
            <Button
              className="w-full mt-2 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white"
              disabled={isApproving}
              onClick={async () => {
                setIsApproving(true);
                try {
                  onReleaseEscrow();
                  setIsOpen(false);
                } finally {
                  setIsApproving(false);
                }
              }}
            >
              {isApproving
                ? "Processing..."
                : "Release Remaining 50% to Seller"}
            </Button>
          )}

          <Alert className="border-[#88CEDC]/30 bg-[#88CEDC]/10">
            <Shield className="h-4 w-4 text-[#88CEDC]" />
            <AlertDescription className="text-gray-700 dark:text-gray-300">
              Banks act as escrow: approve order → release 50% on shipment →
              release remaining 50% on delivery.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-gray-300 dark:border-gray-600"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------
// BankOrdersPage
// ------------------------------
export default function BankOrdersPage() {
  const { data: orders = [], loading, error, refetch } = useBankData("orders");

  const handleOrderApprove = async (
    order: BankOrder,
    bankType: "buyer" | "seller"
  ) => {
    try {
      const bankId =
        bankType === "buyer" ? order.buyerBankId : order.sellerBankId;
      await bankApi.updateEscrow(order.id, {
        bankId: bankId || undefined,
        bankType,
        comments: "Approved by bank",
      });
      refetch();
    } catch (err) {
      debug.error("Failed to approve bank:", err);
    }
  };

  const handleReleaseEscrow = async (escrowId: string) => {
    try {
      await bankApi.confirmDelivery(escrowId, {
        confirmedBy: "BANK_USER",
        notes: "Release remaining 50%",
      });
      refetch();
    } catch (err) {
      debug.error("Failed to release escrow:", err);
    }
  };

  const handleRequestDocs = async (
    order: BankOrder,
    requestTo: "buyer" | "seller"
  ) => {
    try {
      const bankId =
        requestTo === "buyer" ? order.buyerBankId : order.sellerBankId;
      await bankApi.requestDocuments(order.id, {
        bankId: bankId || undefined,
        requestTo,
        comments: `Please submit required documents for order ${
          order.code || order.id
        }`,
      });
      alert(`Document request sent to ${requestTo}`);
      refetch();
    } catch (err) {
      debug.error("Failed to request documents:", err);
      alert("Failed to request documents");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:from-[#0C171B] dark:via-[#1a2930] dark:to-[#0C171B] dark:bg-gradient-to-br">
        <div className="container mx-auto px-6 py-8">
          <Card className="p-8 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700">
            <Package className="w-16 h-16 mx-auto mb-4 text-[#88CEDC] animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading orders...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:from-[#0C171B] dark:via-[#1a2930] dark:to-[#0C171B] dark:bg-gradient-to-br">
        <div className="container mx-auto px-6 py-8">
          <Card className="p-8 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:from-[#0C171B] dark:via-[#1a2930] dark:to-[#0C171B] dark:bg-gradient-to-br">
      <div className="container mx-auto px-6 py-8">
        <BankHeader
          title="Order Management"
          description="Single-approval workflow for banks and escrow release"
        />

        <div className="space-y-4 mt-6">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[#88CEDC]/20 text-[#5BA8B8]">
                      {(order.user?.fullName ?? "NA")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="font-mono text-sm font-semibold text-gray-900 dark:text-white"
                        title={order.id}
                      >
                        {order.code || order.id}
                      </span>
                      <Badge
                        variant="outline"
                        className={`${
                          statusColorMap[order.status]
                        } border flex items-center gap-1`}
                      >
                        {statusIconMap[order.status]}
                        {order.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.items.map((i) => i.product.name).join(", ")}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>👤 Buyer: {order.user.fullName}</span>
                      <span>
                        🏦 Buyer Bank: {order.buyerBankId ? "✓" : "✗"}
                      </span>
                      <span>Seller Bank: {order.sellerBankId ? "✓" : "✗"}</span>
                    </div>
                    <p className="text-sm font-medium text-[#88CEDC]">
                      💰 {getEscrowStatus(order.status)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <OrderApprovalDialog
                    order={order}
                    onApprove={(bankType) =>
                      handleOrderApprove(order, bankType)
                    }
                    onReleaseEscrow={() => handleReleaseEscrow(order.id)}
                    onRequestDocs={(requestTo) =>
                      handleRequestDocs(order, requestTo)
                    }
                  />
                </div>
              </div>
            </Card>
          ))}

          {orders.length === 0 && (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 p-8 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { ReactNode, useState } from "react";
import { BankHeader } from "@/components/bank-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
} from "lucide-react";
import { useBankData } from "@/hooks/useBankData";
import { bankApi } from "@/lib/api";
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
const statusColorMap: Record<OrderStatus, string> = {
  BANK_REVIEW: "warning",
  IN_TRANSIT: "info",
  DELIVERED: "success",
  DISPUTED: "destructive",
  CANCELLED: "destructive",
};

const statusIconMap: Record<OrderStatus, ReactNode> = {
  BANK_REVIEW: <Clock className="h-4 w-4" />,
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={
          order.status !== "BANK_REVIEW" && order.status !== "IN_TRANSIT"
        }
      >
        <Shield className="h-4 w-4 mr-1" />
        {order.status === "BANK_REVIEW" ? "Approve Order" : "Process Escrow"}
      </Button>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Bank Approval / Escrow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p>
              Step {getWorkflowProgress(order).currentStep} of{" "}
              {getWorkflowProgress(order).totalSteps} -{" "}
              {Math.round(getWorkflowProgress(order).progress)}% Complete
            </p>
            <Progress
              value={getWorkflowProgress(order).progress}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {getWorkflowProgress(order).nextAction}
            </p>
          </div>

          {order.status === "BANK_REVIEW" && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Request Documents</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRequestDocs("buyer");
                      setIsOpen(false);
                    }}
                  >
                    From Buyer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRequestDocs("seller");
                      setIsOpen(false);
                    }}
                  >
                    From Seller
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
                  <SelectItem value="buyer" disabled={!order.buyerBankId}>
                    {order.buyerBankId
                      ? "Buyer Bank"
                      : "Buyer Bank (not assigned)"}
                  </SelectItem>
                  <SelectItem value="seller" disabled={!order.sellerBankId}>
                    {order.sellerBankId
                      ? "Seller Bank"
                      : "Seller Bank (not assigned)"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="w-full mt-2"
                disabled={!selectedBank}
                onClick={() => {
                  onApprove(selectedBank as "buyer" | "seller");
                  setIsOpen(false);
                }}
              >
                Approve Order
              </Button>
            </>
          )}

          {order.status === "IN_TRANSIT" && (
            <Button
              className="w-full mt-2"
              variant="secondary"
              onClick={() => {
                onReleaseEscrow();
                setIsOpen(false);
              }}
            >
              Release Remaining 50% to Seller
            </Button>
          )}

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Banks act as escrow: approve order → release 50% on shipment →
              release remaining 50% on delivery.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
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
      if (!bankId) {
        throw new Error(`Missing ${bankType} bank id on order`);
      }
      // Use escrow endpoint which records bank approval and triggers 50% release once both approve
      await bankApi.updateEscrow(order.id, {
        bankId,
        bankType,
        comments: "Approved by bank",
      });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseEscrow = async (escrowId: string) => {
    try {
      // For remaining 50% on delivery, confirm delivery endpoint should be used
      await bankApi.confirmDelivery(escrowId, {
        confirmedBy: "BANK_USER",
        notes: "Release remaining 50%",
      });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestDocs = async (
    order: BankOrder,
    requestTo: "buyer" | "seller"
  ) => {
    try {
      const bankId =
        requestTo === "buyer" ? order.buyerBankId : order.sellerBankId;
      if (!bankId) {
        alert(`No ${requestTo} bank assigned to this order`);
        return;
      }
      await bankApi.requestDocuments(order.id, {
        bankId,
        requestTo,
        comments: `Please submit required documents for order ${
          order.code || order.id
        }`,
      });
      alert(`Document request sent to ${requestTo}`);
      refetch();
    } catch (err) {
      console.error(err);
      alert("Failed to request documents");
    }
  };

  if (loading) return <div className="p-6">Loading orders...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="flex-1 space-y-6 p-6">
      <BankHeader
        title="Order Management"
        description="Single-approval workflow for banks and escrow release"
      />

      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
        >
          <div className="flex items-center gap-4 flex-1">
            <Avatar>
              <AvatarImage src="/placeholder.svg" alt={order.user.fullName} />
              <AvatarFallback>
                {(order.user?.fullName ?? "NA")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm" title={order.id}>
                  {order.code || order.id}
                </span>
                <Badge
                  variant={statusColorMap[order.status] as any}
                  className="flex items-center gap-1"
                >
                  {statusIconMap[order.status]}
                  {order.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {order.items.map((i) => i.product.name).join(", ")}
              </p>
              <p className="text-xs text-muted-foreground">
                👤 Buyer: {order.user.fullName} | 🏦 Buyer Bank:{" "}
                {order.buyerBankId ? "✓" : "✗"} | Seller Bank:{" "}
                {order.sellerBankId ? "✓" : "✗"}
              </p>
              <p className="text-xs text-info font-medium">
                💰 {getEscrowStatus(order.status)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OrderApprovalDialog
              order={order}
              onApprove={(bankType) => handleOrderApprove(order, bankType)}
              onReleaseEscrow={() => handleReleaseEscrow(order.id)}
              onRequestDocs={(requestTo) => handleRequestDocs(order, requestTo)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

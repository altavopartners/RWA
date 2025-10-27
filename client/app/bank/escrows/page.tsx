"use client";

import { useState } from "react";
import { BankHeader } from "@/components/bank-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Truck,
  Lock,
  Unlock,
  FileCheck,
} from "lucide-react";
import { useBankData } from "@/hooks/useBankData";
import { bankApi } from "@/lib/api";
import type { Escrow, OrderStatus } from "@/types/bank";

// Bank approvals drive escrow: both banks approve -> IN_TRANSIT (50% released),
// then confirm delivery -> DELIVERED (100% released)

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "BANK_REVIEW":
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" /> Awaiting Approval
        </Badge>
      );
    case "IN_TRANSIT":
      return (
        <Badge className="bg-chart-3 text-white">
          <Truck className="w-3 h-3 mr-1" /> 50% Released
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge className="bg-chart-1 text-white">
          <CheckCircle className="w-3 h-3 mr-1" /> 100% Released
        </Badge>
      );
    case "DISPUTED":
      return (
        <Badge variant="destructive">
          <Lock className="w-3 h-3 mr-1" /> Disputed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" /> Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getApprovalProgress(escrow: Escrow) {
  let progress = 0;
  let status = "Awaiting Approval";
  if (escrow.buyerBankApproved) progress += 50;
  if (escrow.sellerBankApproved) progress += 50;

  if (progress === 100) status = "Both Banks Approved";
  else if (progress === 50) status = "Partial Approval";

  return { progress, status };
}

function EscrowDetailsDialog({ escrow }: { escrow: Escrow }) {
  const approvalStats = getApprovalProgress(escrow);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-1" /> Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Escrow Contract Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contract Address</Label>
              <p className="font-mono">{escrow.escrowAddress}</p>
            </div>
            <div>
              <Label>Order ID</Label>
              <p className="font-mono">{escrow.code || escrow.id}</p>
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Progress value={approvalStats.progress} className="h-2" />
            <p className="text-sm mt-1">{approvalStats.status}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EscrowApprovalDialog({
  escrow,
  onApproved,
}: {
  escrow: Escrow;
  onApproved: () => void;
}) {
  const [selectedBank, setSelectedBank] = useState<"buyer" | "seller" | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const readyToApprove =
    escrow.status === "BANK_REVIEW" &&
    (!escrow.buyerBankApproved || !escrow.sellerBankApproved);

  const buyerBankId =
    (escrow as any).buyerBank?.id ?? escrow.buyerBankId ?? undefined;
  const sellerBankId =
    (escrow as any).sellerBank?.id ?? escrow.sellerBankId ?? undefined;

  const autoRemainingBank: "buyer" | "seller" | "" = !escrow.buyerBankApproved
    ? "buyer"
    : !escrow.sellerBankApproved
    ? "seller"
    : "";

  const handleApprove = async () => {
    const bankType = (selectedBank || autoRemainingBank) as "buyer" | "seller";
    const bankId = bankType === "buyer" ? buyerBankId : sellerBankId;
    if (!bankType || !bankId) return;

    setSubmitting(true);
    try {
      await bankApi.updateEscrow(escrow.id, {
        bankId,
        bankType,
        comments: notes || undefined,
      });
      onApproved();
    } catch (err) {
      console.error("Failed to approve escrow", err);
      alert(
        "Failed to approve escrow: " +
          ((err as any)?.message || "Unknown error")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!readyToApprove}>
          {readyToApprove ? "Approve as Bank" : "Already Approved"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bank Approval Workflow</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Steps:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                <li>Both buyer and seller banks must approve here</li>
                <li>
                  Buyer and seller must sign blockchain approvals (via MetaMask)
                </li>
                <li>Then the first 50% will be released to the seller</li>
              </ol>
            </AlertDescription>
          </Alert>
          <div>
            <Label>Approve as</Label>
            <Select
              value={selectedBank}
              onValueChange={(v) => setSelectedBank(v as any)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    autoRemainingBank
                      ? `Auto: ${autoRemainingBank} bank`
                      : "Select bank"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {buyerBankId && !escrow.buyerBankApproved && (
                  <SelectItem value="buyer">Buyer Bank</SelectItem>
                )}
                {sellerBankId && !escrow.sellerBankApproved && (
                  <SelectItem value="seller">Seller Bank</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleApprove} disabled={submitting}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EscrowsPage() {
  const { data: escrows, loading, refetch } = useBankData("escrows");

  if (loading) return <p>Loading escrows...</p>;

  return (
    <div className="space-y-4">
      <BankHeader title="Active Escrows" />
      <div className="grid grid-cols-1 gap-4">
        {escrows.map((escrow) => (
          <Card key={escrow.id}>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{escrow.code || escrow.id}</CardTitle>
              {getStatusBadge(escrow.status)}
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div>${Number(escrow.total).toLocaleString()} HBAR</div>
              <div className="flex gap-2">
                <EscrowDetailsDialog escrow={escrow} />
                <EscrowApprovalDialog escrow={escrow} onApproved={refetch} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

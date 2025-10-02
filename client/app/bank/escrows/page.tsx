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
import type { Escrow, Approval } from "@/types/bank";

type BankAction =
  | "verify_docs"
  | "reject_docs"
  | "request_more"
  | "approve"
  | "reject"
  | "hold";

function getStatusBadge(status: string) {
  switch (status) {
    case "FUNDED":
      return (
        <Badge className="bg-chart-5 text-white">
          <Unlock className="w-3 h-3 mr-1" /> Funded
        </Badge>
      );
    case "PARTIAL_RELEASED":
      return (
        <Badge className="bg-chart-3 text-white">
          <Truck className="w-3 h-3 mr-1" /> Partial Released
        </Badge>
      );
    case "FULLY_RELEASED":
      return (
        <Badge className="bg-chart-1 text-white">
          <CheckCircle className="w-3 h-3 mr-1" /> Fully Released
        </Badge>
      );
    case "DISPUTED":
      return (
        <Badge variant="destructive">
          <Lock className="w-3 h-3 mr-1" /> Disputed
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
              <p className="font-mono">
                {escrow.order?.code || escrow.orderId}
              </p>
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
  const [action, setAction] = useState<BankAction | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!action) return;
    setSubmitting(true);
    try {
      await bankApi.updateEscrow(escrow.id, {
        action,
        approvedBy: "CurrentBank", // replace with actual bank identifier
        notes: notes || undefined,
      });
      onApproved();
    } catch (err) {
      console.error("Failed to update escrow", err);
      alert(
        "Failed to update escrow: " + (err as any)?.message || "Unknown error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const readyToApprove =
    escrow.status === "FUNDED" &&
    (!escrow.buyerBankApproved || !escrow.sellerBankApproved);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!readyToApprove}>
          {readyToApprove ? "Process Approval" : "Already Processed"}
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
              Both buyer and seller banks must approve the escrow before fund
              release.
            </AlertDescription>
          </Alert>
          <div>
            <Label>Bank Decision</Label>
            <Select
              value={action}
              onValueChange={(v) => setAction(v as BankAction)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
                <SelectItem value="hold">Place Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(action === "reject" || action === "hold") && (
            <div>
              <Label>Notes / Reason</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!action || submitting}>
            Submit
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
              <CardTitle>{escrow.order?.code || escrow.id}</CardTitle>
              {getStatusBadge(escrow.status)}
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div>
                ${escrow.amount.toLocaleString()} {escrow.currency}
              </div>
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

"use client";

import { useState, useMemo } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Eye,
  Scale,
  Clock,
  CheckCircle,
  Building2,
  User,
  FileText,
  Calendar,
  AlertTriangle,
  Gavel,
} from "lucide-react";
import { useBankData } from "@/hooks/useBankData";
import { bankApi } from "@/lib/api";
import type { Dispute } from "@/types/bank";

// ---------------------------
// Badge helpers
// ---------------------------
function getStatusBadge(status: Dispute["status"]) {
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
  }
}

function getPriorityBadge(priority: Dispute["priority"]) {
  switch (priority) {
    case "High":
      return <Badge variant="destructive">High</Badge>;
    case "Medium":
      return <Badge variant="outline">Medium</Badge>;
    case "Low":
      return <Badge variant="secondary">Low</Badge>;
  }
}

// ---------------------------
// Dispute Details Dialog
// ---------------------------
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
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">
              Evidence ({dispute.evidence.length})
            </TabsTrigger>
            {dispute.rulings.length > 0 && (
              <TabsTrigger value="rulings">Rulings</TabsTrigger>
            )}
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
                    <Badge variant="outline" className="mt-1 text-xs">
                      Dispute Initiator
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evidence">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {dispute.evidence.map((e, i) => (
                  <div key={e.id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <div>
                        {e.submittedBy} - Evidence #{i + 1}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm mt-2">{e.description}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {dispute.rulings.length > 0 && (
            <TabsContent value="rulings">
              <div className="space-y-4">
                {dispute.rulings.map((r) => (
                  <div key={r.id} className="border p-3 rounded-lg bg-muted/50">
                    <div className="flex justify-between">
                      <span>Ruling: {r.ruling}</span>
                      <span>{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <div>Reasoning: {r.reasoning}</div>
                    <div>Arbitrator: {r.arbitratorName}</div>
                    {r.amount && <div>Amount: {r.amount}</div>}
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

// ---------------------------
// Arbitration Dialog
// ---------------------------
function ArbitrationDialog({
  dispute,
  onRule,
}: {
  dispute: Dispute;
  onRule: (ruling: any) => void;
}) {
  const [ruling, setRuling] = useState("");
  const [amount, setAmount] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const isResolved = dispute.status === "Resolved";

  const handleSubmit = () => {
    onRule({
      ruling,
      amount: amount ? parseFloat(amount) : undefined,
      reasoning,
    });
    setIsOpen(false);
    setRuling("");
    setAmount("");
    setReasoning("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isResolved}>
          {isResolved ? "Resolved" : "Issue Ruling"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Issue Arbitration Ruling</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Decision</Label>
            <Select value={ruling} onValueChange={setRuling}>
              <SelectTrigger>
                <SelectValue placeholder="Select ruling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PartialRefund">Partial Refund</SelectItem>
                <SelectItem value="FullRefund">Full Refund</SelectItem>
                <SelectItem value="ReleaseFunds">Release Funds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(ruling === "PartialRefund" || ruling === "FullRefund") && (
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder={dispute.amount.toString()}
                value={
                  ruling === "FullRefund" ? dispute.amount.toString() : amount
                }
                onChange={(e) => setAmount(e.target.value)}
                disabled={ruling === "FullRefund"}
              />
            </div>
          )}

          <div>
            <Label>Reasoning</Label>
            <Textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!ruling || !reasoning}>
            Issue Final Ruling
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------
// Main Disputes Page
// ---------------------------
export default function DisputesPage() {
  const {
    data: disputes = [],
    loading,
    error,
    refetch,
  } = useBankData("disputes");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Dispute["status"]>(
    "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | Dispute["priority"]
  >("all");

  const handleRuling = async (disputeId: string, rulingData: any) => {
    try {
      await bankApi.updateDispute(disputeId, {
        action: "resolve",
        ruling: rulingData,
        reviewedBy: "admin",
      });
      refetch();
    } catch (err) {
      console.error("Failed to issue ruling:", err);
    }
  };

  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      const matchesSearch =
        dispute.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.producer.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        dispute.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || dispute.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || dispute.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [disputes, searchTerm, statusFilter, priorityFilter]);

  if (loading) return <div className="p-6">Loading disputes...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6 p-6">
      <BankHeader
        title="Dispute Resolution"
        description="Arbitrate trade disputes and issue binding rulings"
      />

      <div className="space-y-4">
        <Input
          placeholder="Search disputes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* ✅ Your filter block inserted here */}
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | Dispute["status"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="UnderReview">Under Review</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value) =>
              setPriorityFilter(value as "all" | Dispute["priority"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Producer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDisputes.map((dispute) => (
              <TableRow key={dispute.id}>
                <TableCell>{dispute.orderId}</TableCell>
                <TableCell>{dispute.buyer.name}</TableCell>
                <TableCell>{dispute.producer.name}</TableCell>
                <TableCell>
                  {dispute.amount.toLocaleString()} {dispute.currency}
                </TableCell>
                <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                <TableCell className="space-x-2 flex">
                  <DisputeDetailsDialog dispute={dispute} />
                  <ArbitrationDialog
                    dispute={dispute}
                    onRule={(data) => handleRuling(dispute.id, data)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { BankHeader } from "@/components/bank-header";
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
import {
  Eye,
  Clock,
  CheckCircle,
  Building2,
  User,
  AlertTriangle,
  Scale,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import { useBankData } from "@/hooks/useBankData";
import { bankApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Dispute Review - {dispute.orderId}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">
              Evidence ({dispute.evidence.length})
            </TabsTrigger>
            {dispute.rulings.length > 0 && (
              <TabsTrigger value="rulings">
                Rulings ({dispute.rulings.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Dispute Amount</Label>
                </div>
                <p className="text-2xl font-bold">
                  {dispute.amount.toLocaleString()} {dispute.currency}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Priority Level</Label>
                </div>
                <div className="mt-1">{getPriorityBadge(dispute.priority)}</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Dispute Created</Label>
              </div>
              <p className="text-sm">
                {new Date(dispute.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Dispute Reason</Label>
              </div>
              <p className="text-sm leading-relaxed">{dispute.reason}</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">
                Parties Involved
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-lg">
                      {dispute.producer.name}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Producer / Seller
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-lg">
                      {dispute.buyer.name}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                  {dispute.initiatedBy === "Buyer" && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Dispute Initiator
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evidence">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {dispute.evidence.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No evidence submitted yet</p>
                  </div>
                ) : (
                  dispute.evidence.map((e, i) => (
                    <div
                      key={e.id}
                      className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Evidence #{i + 1}</Badge>
                          <span className="font-medium">{e.submittedBy}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(e.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm mb-2">{e.description}</p>
                      {e.fileName && (
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {e.fileName}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {dispute.rulings.length > 0 && (
            <TabsContent value="rulings">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {dispute.rulings.map((r) => {
                    const ruling = r as {
                      id: string;
                      ruling: string;
                      createdAt?: string;
                      reasoning?: string;
                      arbitratorName?: string;
                      amount?: number;
                    };

                    return (
                      <div
                        key={ruling.id}
                        className="border rounded-lg p-4 bg-muted/30"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <Badge className="text-sm">
                            <Scale className="w-3 h-3 mr-1" />
                            {ruling.ruling}
                          </Badge>
                          {ruling.createdAt && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(ruling.createdAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {ruling.reasoning && (
                          <div className="mb-2">
                            <Label className="text-xs text-muted-foreground">
                              Reasoning:
                            </Label>
                            <p className="text-sm mt-1">{ruling.reasoning}</p>
                          </div>
                        )}
                        {ruling.arbitratorName && (
                          <div className="text-xs text-muted-foreground">
                            Arbitrator: {ruling.arbitratorName}
                          </div>
                        )}
                        {ruling.amount && (
                          <div className="text-sm font-semibold mt-2 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {ruling.amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
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
  onRule: (ruling: {
    ruling: string;
    amount?: number;
    reasoning: string;
  }) => void;
}) {
  const [ruling, setRuling] = useState("");
  const [amount, setAmount] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const isResolved = dispute.status === "Resolved";

  const handleSubmit = () => {
    if (!ruling || !reasoning) return;

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
        <Button
          variant={isResolved ? "ghost" : "default"}
          size="sm"
          disabled={isResolved}
        >
          <Scale className="w-4 h-4 mr-1" />
          {isResolved ? "Resolved" : "Issue Ruling"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Issue Arbitration Ruling
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Dispute Amount:</span>
              <span className="text-lg font-bold">
                {dispute.amount.toLocaleString()} {dispute.currency}
              </span>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4" />
              Decision
            </Label>
            <Select value={ruling} onValueChange={setRuling}>
              <SelectTrigger>
                <SelectValue placeholder="Select your ruling decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PartialRefund">
                  Partial Refund to Buyer
                </SelectItem>
                <SelectItem value="FullRefund">Full Refund to Buyer</SelectItem>
                <SelectItem value="ReleaseFunds">
                  Release Funds to Seller
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(ruling === "PartialRefund" || ruling === "FullRefund") && (
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                Refund Amount ({dispute.currency})
              </Label>
              <Input
                type="number"
                placeholder={`Enter amount (max: ${dispute.amount})`}
                value={
                  ruling === "FullRefund" ? dispute.amount.toString() : amount
                }
                onChange={(e) => setAmount(e.target.value)}
                disabled={ruling === "FullRefund"}
                max={dispute.amount}
              />
              {ruling === "FullRefund" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Full dispute amount will be refunded
                </p>
              )}
            </div>
          )}

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              Reasoning & Justification
            </Label>
            <Textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Provide detailed reasoning for your decision..."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be visible to both parties
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!ruling || !reasoning}>
            <CheckCircle className="w-4 h-4 mr-1" />
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
  const { toast } = useToast();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRuling = async (
    disputeId: string,
    rulingData: { ruling: string; amount?: number; reasoning: string }
  ) => {
    setIsSubmitting(true);
    try {
      await bankApi.updateDispute(disputeId, {
        action: "resolve",
        ruling: rulingData,
        reviewedBy: "admin",
      });

      toast({
        title: "Ruling Issued Successfully",
        description: `Your ${rulingData.ruling} decision has been recorded and parties have been notified.`,
        variant: "default",
      });

      refetch();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";

      toast({
        title: "Failed to Issue Ruling",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Clock className="w-12 h-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading disputes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Error Loading Disputes</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <BankHeader
        title="Dispute Resolution"
        description="Arbitrate trade disputes and issue binding rulings"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Disputes</p>
              <p className="text-2xl font-bold">{disputes.length}</p>
            </div>
            <Scale className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-destructive">
                {disputes.filter((d) => d.status === "Open").length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-destructive opacity-50" />
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Under Review</p>
              <p className="text-2xl font-bold text-yellow-500">
                {disputes.filter((d) => d.status === "UnderReview").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-500">
                {disputes.filter((d) => d.status === "Resolved").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <Input
          placeholder="Search by order ID, buyer, seller, or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | Dispute["status"])
            }
          >
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          {(statusFilter !== "all" || priorityFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredDisputes.length} of {disputes.length} disputes
      </div>

      {/* Disputes Table */}
      <div className="border rounded-lg">
        <ScrollArea className="h-[calc(100vh-500px)] min-h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Producer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Scale className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {searchTerm ||
                      statusFilter !== "all" ||
                      priorityFilter !== "all"
                        ? "No disputes match your filters"
                        : "No disputes found"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDisputes.map((dispute) => (
                  <TableRow key={dispute.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {dispute.orderId}
                    </TableCell>
                    <TableCell>{dispute.buyer.name}</TableCell>
                    <TableCell>{dispute.producer.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        {dispute.amount.toLocaleString()} {dispute.currency}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DisputeDetailsDialog dispute={dispute} />
                        <ArbitrationDialog
                          dispute={dispute}
                          onRule={(data) => handleRuling(dispute.id, data)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <Clock className="w-8 h-8 animate-spin" />
            <p>Submitting ruling...</p>
          </div>
        </div>
      )}
    </div>
  );
}

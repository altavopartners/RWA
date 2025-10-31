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
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white flex items-center gap-1 shadow-lg shadow-red-500/30 border-0">
          <AlertTriangle className="w-3 h-3" />
          Open
        </Badge>
      );
    case "UnderReview":
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1 shadow-lg shadow-amber-500/30 border-0">
          <Clock className="w-3 h-3" />
          Under Review
        </Badge>
      );
    case "Resolved":
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-1 shadow-lg shadow-green-500/30 border-0">
          <CheckCircle className="w-3 h-3" />
          Resolved
        </Badge>
      );
  }
}

function getPriorityBadge(priority: Dispute["priority"]) {
  switch (priority) {
    case "High":
      return <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg">High</Badge>;
    case "Medium":
      return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">Medium</Badge>;
    case "Low":
      return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg">Low</Badge>;
  }
}

// ---------------------------
// Dispute Details Dialog
// ---------------------------
function DisputeDetailsDialog({ dispute }: { dispute: Dispute }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-gradient-to-r hover:from-[#88CEDC]/10 hover:to-[#5BA8B8]/10 transition-all duration-300 hover:scale-105 rounded-xl"
        >
          <Eye className="w-4 h-4 mr-1 text-[#5BA8B8]" />
          Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
            <Scale className="w-5 h-5 text-[#5BA8B8]" />
            Dispute Review - {dispute.orderId}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#88CEDC] data-[state=active]:to-[#5BA8B8] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="evidence" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#88CEDC] data-[state=active]:to-[#5BA8B8] data-[state=active]:text-white">
              Evidence ({dispute.evidence.length})
            </TabsTrigger>
            {dispute.rulings.length > 0 && (
              <TabsTrigger value="rulings" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#88CEDC] data-[state=active]:to-[#5BA8B8] data-[state=active]:text-white">
                Rulings ({dispute.rulings.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#5BA8B8]" />
                  <Label className="text-sm font-bold text-gray-900 dark:text-white">Dispute Amount</Label>
                </div>
                <p className="text-2xl font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
                  {dispute.amount.toLocaleString()} {dispute.currency}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-[#5BA8B8]" />
                  <Label className="text-sm font-bold text-gray-900 dark:text-white">Priority Level</Label>
                </div>
                <div className="mt-1">{getPriorityBadge(dispute.priority)}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#5BA8B8]" />
                <Label className="text-sm font-bold text-gray-900 dark:text-white">Dispute Created</Label>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {new Date(dispute.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#5BA8B8]" />
                <Label className="text-sm font-bold text-gray-900 dark:text-white">Dispute Reason</Label>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{dispute.reason}</p>
            </div>

            <div>
              <Label className="text-sm font-bold mb-3 block text-gray-900 dark:text-white">
                Parties Involved
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-20 blur-lg transition-all duration-500" />
                  <div className="relative p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {dispute.producer.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Producer / Seller
                    </p>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-20 blur-lg transition-all duration-500" />
                  <div className="relative p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-green-500" />
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {dispute.buyer.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Buyer</p>
                    {dispute.initiatedBy === "Buyer" && (
                      <Badge className="mt-2 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Dispute Initiator
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evidence">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {dispute.evidence.length === 0 ? (
                  <div className="text-center py-12 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">No evidence submitted yet</p>
                  </div>
                ) : (
                  dispute.evidence.map((e, i) => (
                    <div
                      key={e.id}
                      className="rounded-xl p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] text-white border-0">
                            Evidence #{i + 1}
                          </Badge>
                          <span className="font-semibold text-gray-900 dark:text-white">{e.submittedBy}</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(e.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">{e.description}</p>
                      {e.fileName && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
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
                        className="rounded-xl p-4 bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <Badge className="text-sm bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] text-white border-0 shadow-lg">
                            <Scale className="w-3 h-3 mr-1" />
                            {ruling.ruling}
                          </Badge>
                          {ruling.createdAt && (
                            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(ruling.createdAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {ruling.reasoning && (
                          <div className="mb-2">
                            <Label className="text-xs text-gray-600 dark:text-gray-400">
                              Reasoning:
                            </Label>
                            <p className="text-sm mt-1 text-gray-900 dark:text-white">{ruling.reasoning}</p>
                          </div>
                        )}
                        {ruling.arbitratorName && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Arbitrator: {ruling.arbitratorName}
                          </div>
                        )}
                        {ruling.amount && (
                          <div className="text-sm font-bold mt-2 flex items-center gap-1 text-gray-900 dark:text-white">
                            <DollarSign className="w-4 h-4 text-[#5BA8B8]" />
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
          className={!isResolved ? "bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white shadow-lg rounded-xl" : "rounded-xl"}
        >
          <Scale className="w-4 h-4 mr-1" />
          {isResolved ? "Resolved" : "Issue Ruling"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
            <Scale className="w-5 h-5 text-[#5BA8B8]" />
            Issue Arbitration Ruling
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Dispute Amount:</span>
              <span className="text-lg font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
                {dispute.amount.toLocaleString()} {dispute.currency}
              </span>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-900 dark:text-white">
              <Scale className="w-4 h-4 text-[#5BA8B8]" />
              Decision
            </Label>
            <Select value={ruling} onValueChange={setRuling}>
              <SelectTrigger className="rounded-xl border-gray-200/50 dark:border-gray-700/50">
                <SelectValue placeholder="Select your ruling decision" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-xl">
                <SelectItem value="PartialRefund" className="rounded-lg">
                  Partial Refund to Buyer
                </SelectItem>
                <SelectItem value="FullRefund" className="rounded-lg">Full Refund to Buyer</SelectItem>
                <SelectItem value="ReleaseFunds" className="rounded-lg">
                  Release Funds to Seller
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(ruling === "PartialRefund" || ruling === "FullRefund") && (
            <div>
              <Label className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-900 dark:text-white">
                <DollarSign className="w-4 h-4 text-[#5BA8B8]" />
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
                className="rounded-xl border-gray-200/50 dark:border-gray-700/50"
              />
              {ruling === "FullRefund" && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Full dispute amount will be refunded
                </p>
              )}
            </div>
          )}

          <div>
            <Label className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-900 dark:text-white">
              <FileText className="w-4 h-4 text-[#5BA8B8]" />
              Reasoning & Justification
            </Label>
            <Textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Provide detailed reasoning for your decision..."
              rows={5}
              className="resize-none rounded-xl border-gray-200/50 dark:border-gray-700/50"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              This will be visible to both parties
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="rounded-xl border-gray-200/50 dark:border-gray-700/50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!ruling || !reasoning}
            className="bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white shadow-lg rounded-xl"
          >
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="inline-block w-12 h-12 rounded-full border-4 border-[#88CEDC]/20 border-t-[#88CEDC] animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading disputes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center space-y-4 max-w-md">
          <div className="relative p-8 rounded-2xl bg-red-50/80 dark:bg-red-950/20 backdrop-blur-xl border border-red-200/50 dark:border-red-900/50">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error Loading Disputes</h2>
            <p className="text-red-500 dark:text-red-400 mt-2">{error}</p>
            <Button 
              onClick={() => refetch()}
              className="mt-4 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white shadow-lg rounded-xl"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <BankHeader
        title="Dispute Resolution"
        description="Arbitrate trade disputes and issue binding rulings"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Disputes", value: disputes.length, icon: Scale, color: "from-[#5BA8B8] to-[#88CEDC]" },
          { label: "Open", value: disputes.filter((d) => d.status === "Open").length, icon: AlertTriangle, color: "from-red-500 to-pink-500" },
          { label: "Under Review", value: disputes.filter((d) => d.status === "UnderReview").length, icon: Clock, color: "from-amber-500 to-orange-500" },
          { label: "Resolved", value: disputes.filter((d) => d.status === "Resolved").length, icon: CheckCircle, color: "from-green-500 to-emerald-500" },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="group relative animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.color} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`} />
            <div className="relative p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 hover:border-[#88CEDC]/50 transition-all duration-300 group-hover:shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{stat.label}</p>
                  <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`w-8 h-8 opacity-50 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity" />
          <Input
            placeholder="Search by order ID, buyer, seller, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative max-w-md pl-4 py-6 rounded-xl border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "all" | Dispute["status"])
            }
          >
            <SelectTrigger className="w-[180px] rounded-xl border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl py-6">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-xl">
              <SelectItem value="all" className="rounded-lg">All Statuses</SelectItem>
              <SelectItem value="Open" className="rounded-lg">Open</SelectItem>
              <SelectItem value="UnderReview" className="rounded-lg">Under Review</SelectItem>
              <SelectItem value="Resolved" className="rounded-lg">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value) =>
              setPriorityFilter(value as "all" | Dispute["priority"])
            }
          >
            <SelectTrigger className="w-[180px] rounded-xl border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl py-6">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-xl">
              <SelectItem value="all" className="rounded-lg">All Priorities</SelectItem>
              <SelectItem value="High" className="rounded-lg">High</SelectItem>
              <SelectItem value="Medium" className="rounded-lg">Medium</SelectItem>
              <SelectItem value="Low" className="rounded-lg">Low</SelectItem>
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
              className="rounded-xl hover:bg-gradient-to-r hover:from-[#88CEDC]/10 hover:to-[#5BA8B8]/10"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        Showing <span className="font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">{filteredDisputes.length}</span> of {disputes.length} disputes
      </div>

      {/* Disputes Table */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-3xl opacity-10 blur-2xl" />
        <div className="relative rounded-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
          <ScrollArea className="h-[calc(100vh-500px)] min-h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-gradient-to-r from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl z-10">
                <TableRow className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-[#88CEDC]/20 hover:to-[#5BA8B8]/20">
                  <TableHead className="font-bold text-gray-900 dark:text-white">Order ID</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Buyer</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Producer</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Amount</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Status</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-white">Priority</TableHead>
                  <TableHead className="text-right font-bold text-gray-900 dark:text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                        <Scale className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          priorityFilter !== "all"
                            ? "No disputes match your filters"
                            : "No disputes found"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDisputes.map((dispute, index) => (
                    <TableRow 
                      key={dispute.id} 
                      className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-[#88CEDC]/5 hover:to-[#5BA8B8]/5 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {dispute.orderId}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-medium">{dispute.buyer.name}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-medium">{dispute.producer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                          <DollarSign className="w-4 h-4 text-[#5BA8B8]" />
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
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-gray-200/50 dark:border-gray-800/50">
            <div className="w-12 h-12 rounded-full border-4 border-[#88CEDC]/20 border-t-[#88CEDC] animate-spin"></div>
            <p className="font-medium text-gray-900 dark:text-white">Submitting ruling...</p>
          </div>
        </div>
      )}
    </div>
  );
}
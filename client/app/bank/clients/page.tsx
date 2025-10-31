"use client";

import { useState } from "react";
import { BankHeader } from "@/components/bank-header";
import { debug } from "@/lib/debug";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
} from "lucide-react";

import { useBankData } from "@/hooks/useBankData";
import { bankApi } from "@/lib/api";
import type { Client } from "@/types/bank";

/////////////////////////
// KYC Badge Helper
/////////////////////////

function getKycStatusBadge(status: Client["kycStatus"]) {
  switch (status) {
    case "VERIFIED":
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-1 shadow-lg shadow-green-500/30 border-0">
          <CheckCircle className="w-3 h-3" />
          Verified
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1 shadow-lg shadow-amber-500/30 border-0">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white flex items-center gap-1 shadow-lg shadow-red-500/30 border-0">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {status || "Unknown"}
        </Badge>
      );
  }
}

/////////////////////////
// KYC Action Dialog
/////////////////////////

type KycAction = "" | "approve" | "reject" | "request_info";

interface KycActionDialogProps {
  client: Client;
  onAction: (action: Exclude<KycAction, "">, reason?: string) => void;
}

function KycActionDialog({ client, onAction }: KycActionDialogProps) {
  const [action, setAction] = useState<KycAction>("");
  const [reason, setReason] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (action) onAction(action as Exclude<KycAction, "">, reason);
    setIsOpen(false);
    setAction("");
    setReason("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-gradient-to-r hover:from-[#88CEDC]/10 hover:to-[#5BA8B8]/10 transition-all duration-300 hover:scale-105 border-gray-200/50 dark:border-gray-700/50 rounded-xl"
          aria-label={`Review KYC for ${client.fullName}`}
        >
          <Eye className="w-4 h-4 mr-1 text-[#5BA8B8]" />
          Review KYC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
            KYC Review - {client.fullName}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Review and approve or reject the KYC application for this client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
              <Label className="text-sm font-bold text-gray-900 dark:text-white">Client Type</Label>
              <div className="flex items-center gap-2 mt-2">
                {client.userType === "PRODUCER" ? (
                  <Building2 className="w-4 h-4 text-[#5BA8B8]" />
                ) : (
                  <User className="w-4 h-4 text-[#5BA8B8]" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{client.userType}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
              <Label className="text-sm font-bold text-gray-900 dark:text-white">Account ID</Label>
              <p className="text-sm font-mono mt-2 text-gray-700 dark:text-gray-300">
                {client.accountId || "N/A"}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
            <Label className="text-sm font-bold text-gray-900 dark:text-white">Current Status</Label>
            <div className="mt-2">{getKycStatusBadge(client.kycStatus)}</div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
            <Label className="text-sm font-bold text-gray-900 dark:text-white">Trading History</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{client.orderCount || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Volume</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  ${(client.totalVolume || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="action" className="text-sm font-bold text-gray-900 dark:text-white">Action</Label>
            <Select
              value={action}
              onValueChange={(value: string) => setAction(value as KycAction)}
            >
              <SelectTrigger className="mt-2 rounded-xl border-gray-200/50 dark:border-gray-700/50">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-xl">
                <SelectItem value="approve" className="rounded-lg">Approve KYC</SelectItem>
                <SelectItem value="reject" className="rounded-lg">Reject KYC</SelectItem>
                <SelectItem value="request_info" className="rounded-lg">
                  Request Additional Information
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(action === "reject" || action === "request_info") && (
            <div>
              <Label htmlFor="reason" className="text-sm font-bold text-gray-900 dark:text-white">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Provide reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2 rounded-xl border-gray-200/50 dark:border-gray-700/50"
              />
            </div>
          )}
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
            disabled={!action || (action !== "approve" && !reason)}
            className="bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white shadow-lg rounded-xl"
          >
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/////////////////////////
// ClientsPage
/////////////////////////

type StatusFilter = "all" | "PENDING" | "VERIFIED" | "REJECTED";

export default function ClientsPage() {
  const {
    data: clients = [],
    loading,
    error,
    refetch,
  } = useBankData("clients");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const handleKycAction = async (
    clientId: string,
    action: Exclude<KycAction, "">,
    reason?: string
  ) => {
    try {
      await bankApi.updateClientKyc(clientId, {
        action,
        reason,
        reviewedBy: "admin",
      });
      refetch();
    } catch (err) {
      debug.error("Failed to update KYC:", err);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || client.kycStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: clients.length,
    pending: clients.filter((c) => c.kycStatus === "PENDING").length,
    verified: clients.filter((c) => c.kycStatus === "VERIFIED").length,
    rejected: clients.filter((c) => c.kycStatus === "REJECTED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 rounded-full border-4 border-[#88CEDC]/20 border-t-[#88CEDC] animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="relative p-8 text-center rounded-2xl bg-red-50/80 dark:bg-red-950/20 backdrop-blur-xl border border-red-200/50 dark:border-red-900/50">
          <p className="text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <BankHeader
        title="Client Management"
        description="Manage KYC validation and client compliance status"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([key, count], index) => (
          <div
            key={key}
            className="group relative animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
            <Card className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 hover:border-[#88CEDC]/50 transition-all duration-300 group-hover:shadow-2xl rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
                  {count}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-3xl opacity-10 blur-2xl" />
        <Card className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 rounded-3xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
              Client Directory
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Review and manage KYC status for all assigned clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity" />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#5BA8B8] h-5 w-5 z-10" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="relative pl-12 py-6 rounded-xl border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value: string) =>
                  setStatusFilter(value as StatusFilter)
                }
              >
                <SelectTrigger className="w-[200px] rounded-xl border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl py-6">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-xl">
                  <SelectItem value="all" className="rounded-lg">All Status</SelectItem>
                  <SelectItem value="PENDING" className="rounded-lg">Pending</SelectItem>
                  <SelectItem value="VERIFIED" className="rounded-lg">Verified</SelectItem>
                  <SelectItem value="REJECTED" className="rounded-lg">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#88CEDC]/10 to-[#5BA8B8]/10 border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-[#88CEDC]/20 hover:to-[#5BA8B8]/20">
                    <TableHead className="font-bold text-gray-900 dark:text-white">Client</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white">Type</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white">KYC Status</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white">Expiry Date</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white">Trading Activity</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white">Last Activity</TableHead>
                    <TableHead className="font-bold text-gray-900 dark:text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client, index) => (
                    <TableRow 
                      key={client.id}
                      className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-[#88CEDC]/5 hover:to-[#5BA8B8]/5 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{client.fullName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {client.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                            {client.accountId || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {client.userType === "PRODUCER" ? (
                            <Building2 className="w-4 h-4 text-[#5BA8B8]" />
                          ) : (
                            <User className="w-4 h-4 text-[#5BA8B8]" />
                          )}
                          <span className="font-medium text-gray-700 dark:text-gray-300">{client.userType}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getKycStatusBadge(client.kycStatus)}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-medium">
                        {client.kycExpiry
                          ? new Date(client.kycExpiry).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900 dark:text-white">{client.orderCount || 0} orders</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            ${(client.totalVolume || 0).toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 font-medium">
                        {client.lastActivity
                          ? new Date(client.lastActivity).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <KycActionDialog
                          client={client}
                          onAction={(action, reason) =>
                            handleKycAction(client.id, action, reason)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-[#88CEDC]/10 to-[#5BA8B8]/10 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    No clients found matching your criteria.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
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
  AlertTriangle,
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
        <Badge className="bg-chart-5 text-white flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Verified
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status || "Unknown"}</Badge>;
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
          aria-label={`Review KYC for ${client.fullName}`}
        >
          <Eye className="w-4 h-4 mr-1" />
          Review KYC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>KYC Review - {client.fullName}</DialogTitle>
          <DialogDescription>
            Review and approve or reject the KYC application for this client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Client Type</Label>
              <div className="flex items-center gap-2 mt-1">
                {client.userType === "PRODUCER" ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm">{client.userType}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Account ID</Label>
              <p className="text-sm font-mono mt-1">
                {client.accountId || "N/A"}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="mt-1">{getKycStatusBadge(client.kycStatus)}</div>
          </div>

          <div>
            <Label className="text-sm font-medium">Trading History</Label>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-sm font-medium">{client.orderCount || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Volume</p>
                <p className="text-sm font-medium">
                  ${(client.totalVolume || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="action">Action</Label>
            <Select
              value={action}
              onValueChange={(value: string) => setAction(value as KycAction)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve KYC</SelectItem>
                <SelectItem value="reject">Reject KYC</SelectItem>
                <SelectItem value="request_info">
                  Request Additional Information
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(action === "reject" || action === "request_info") && (
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Provide reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!action || (action !== "approve" && !reason)}
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
      console.error("Failed to update KYC:", err);
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

  if (loading) return <div className="p-6">Loading clients...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6 p-6">
      <BankHeader
        title="Client Management"
        description="Manage KYC validation and client compliance status"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([key, count]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>
            Review and manage KYC status for all assigned clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: string) =>
                setStatusFilter(value as StatusFilter)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Trading Activity</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {client.email}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {client.accountId || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {client.userType === "PRODUCER" ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        {client.userType}
                      </div>
                    </TableCell>
                    <TableCell>{getKycStatusBadge(client.kycStatus)}</TableCell>
                    <TableCell>
                      {client.kycExpiry
                        ? new Date(client.kycExpiry).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{client.orderCount || 0} orders</div>
                        <div className="text-muted-foreground">
                          ${(client.totalVolume || 0).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
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
            <div className="text-center py-8 text-muted-foreground">
              No clients found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

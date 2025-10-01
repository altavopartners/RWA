"use client"

import { useState } from "react"
import { BankHeader } from "@/components/bank-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, CheckCircle, XCircle, Clock, AlertTriangle, Building2, User } from "lucide-react"

// Mock data - in real app this would come from API
const mockClients = [
  {
    id: "1",
    name: "ABC Trading Corp",
    email: "contact@abctrading.com",
    type: "Producer",
    hederaId: "0.0.123456",
    bankId: "BNK001",
    kycStatus: "Pending",
    kycExpiry: null,
    createdAt: "2024-01-15",
    lastActivity: "2024-01-20",
    orderCount: 5,
    totalVolume: 2500000,
  },
  {
    id: "2",
    name: "Global Exports Ltd",
    email: "admin@globalexports.com",
    type: "Buyer",
    hederaId: "0.0.789012",
    bankId: "BNK001",
    kycStatus: "Verified",
    kycExpiry: "2025-01-15",
    createdAt: "2023-12-01",
    lastActivity: "2024-01-19",
    orderCount: 12,
    totalVolume: 5800000,
  },
  {
    id: "3",
    name: "Premium Commodities Inc",
    email: "kyc@premiumcom.com",
    type: "Producer",
    hederaId: "0.0.345678",
    bankId: "BNK001",
    kycStatus: "Expired",
    kycExpiry: "2024-01-01",
    createdAt: "2023-08-10",
    lastActivity: "2024-01-18",
    orderCount: 8,
    totalVolume: 3200000,
  },
  {
    id: "4",
    name: "International Buyers Co",
    email: "compliance@intlbuyers.com",
    type: "Buyer",
    hederaId: "0.0.901234",
    bankId: "BNK001",
    kycStatus: "Rejected",
    kycExpiry: null,
    createdAt: "2024-01-10",
    lastActivity: "2024-01-17",
    orderCount: 0,
    totalVolume: 0,
  },
]

function getKycStatusBadge(status: string) {
  switch (status) {
    case "Verified":
      return (
        <Badge className="bg-chart-5 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      )
    case "Pending":
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    case "Expired":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      )
    case "Rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function KycActionDialog({ client, onAction }: { client: any; onAction: (action: string, reason?: string) => void }) {
  const [action, setAction] = useState<string>("")
  const [reason, setReason] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = () => {
    onAction(action, reason)
    setIsOpen(false)
    setAction("")
    setReason("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          Review KYC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>KYC Review - {client.name}</DialogTitle>
          <DialogDescription>Review and approve or reject the KYC application for this client.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Client Type</Label>
              <div className="flex items-center gap-2 mt-1">
                {client.type === "Producer" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span className="text-sm">{client.type}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Hedera ID</Label>
              <p className="text-sm font-mono mt-1">{client.hederaId}</p>
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
                <p className="text-sm font-medium">{client.orderCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Volume</p>
                <p className="text-sm font-medium">${client.totalVolume.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="action">Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve KYC</SelectItem>
                <SelectItem value="reject">Reject KYC</SelectItem>
                <SelectItem value="request_info">Request Additional Information</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(action === "reject" || action === "request_info") && (
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Provide reason for rejection or additional information needed..."
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
          <Button onClick={handleSubmit} disabled={!action || (action !== "approve" && !reason)}>
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState(mockClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || client.kycStatus.toLowerCase() === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleKycAction = async (clientId: string, action: string, reason?: string) => {
    // In real app, this would call the API
    console.log(`KYC Action: ${action} for client ${clientId}`, reason)

    // Update local state for demo
    setClients((prev) =>
      prev.map((client) => {
        if (client.id === clientId) {
          let newStatus = client.kycStatus
          let newExpiry = client.kycExpiry

          if (action === "approve") {
            newStatus = "Verified"
            newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          } else if (action === "reject") {
            newStatus = "Rejected"
            newExpiry = null
          }

          return { ...client, kycStatus: newStatus, kycExpiry: newExpiry }
        }
        return client
      }),
    )
  }

  const statusCounts = {
    all: clients.length,
    pending: clients.filter((c) => c.kycStatus === "Pending").length,
    verified: clients.filter((c) => c.kycStatus === "Verified").length,
    expired: clients.filter((c) => c.kycStatus === "Expired").length,
    rejected: clients.filter((c) => c.kycStatus === "Rejected").length,
  }

  return (
    <div className="space-y-6 p-6">
      <BankHeader title="Client Management" description="Manage KYC validation and client compliance status" />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{statusCounts.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{statusCounts.verified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusCounts.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusCounts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>Review and manage KYC status for all assigned clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clients Table */}
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
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                        <div className="text-xs text-muted-foreground font-mono">{client.hederaId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {client.type === "Producer" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        {client.type}
                      </div>
                    </TableCell>
                    <TableCell>{getKycStatusBadge(client.kycStatus)}</TableCell>
                    <TableCell>
                      {client.kycExpiry ? (
                        <div className="text-sm">{new Date(client.kycExpiry).toLocaleDateString()}</div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{client.orderCount} orders</div>
                        <div className="text-muted-foreground">${client.totalVolume.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(client.lastActivity).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <KycActionDialog
                        client={client}
                        onAction={(action, reason) => handleKycAction(client.id, action, reason)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No clients found matching your criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

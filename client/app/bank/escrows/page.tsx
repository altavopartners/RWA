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
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Eye, CheckCircle, XCircle, Clock, Shield, Building2, User, Key, Lock, Unlock } from "lucide-react"

// Mock data - in real app this would come from API
const mockEscrows = [
  {
    id: "1",
    orderId: "ORD-2024-001",
    contractAddress: "0.0.123456",
    clientId: "1",
    clientName: "ABC Trading Corp",
    clientType: "Producer",
    counterpartyName: "Global Imports Ltd",
    counterpartyBank: "International Bank",
    amount: 2500000,
    currency: "HBAR",
    status: "Pending",
    releaseConditions: "Document validation complete, goods delivered",
    createdAt: "2024-01-20T10:00:00Z",
    expiresAt: "2024-02-20T10:00:00Z",
    approvals: [
      {
        bankId: "BNK001",
        bankName: "Compliance Bank Ltd",
        approved: true,
        signature: "0x1a2b3c...",
        signedAt: "2024-01-20T14:30:00Z",
        signedBy: "Compliance Officer A",
      },
      {
        bankId: "BNK002",
        bankName: "Trade Finance Bank",
        approved: null,
        signature: null,
        signedAt: null,
        signedBy: null,
      },
      {
        bankId: "BNK003",
        bankName: "International Bank",
        approved: null,
        signature: null,
        signedAt: null,
        signedBy: null,
      },
    ],
  },
  {
    id: "2",
    orderId: "ORD-2024-002",
    contractAddress: "0.0.789012",
    clientId: "2",
    clientName: "Global Exports Ltd",
    clientType: "Buyer",
    counterpartyName: "Premium Commodities Inc",
    counterpartyBank: "Trade Finance Bank",
    amount: 1800000,
    currency: "HBAR",
    status: "Active",
    releaseConditions: "Quality inspection passed, shipping documents verified",
    createdAt: "2024-01-19T09:15:00Z",
    expiresAt: "2024-02-19T09:15:00Z",
    approvals: [
      {
        bankId: "BNK001",
        bankName: "Compliance Bank Ltd",
        approved: true,
        signature: "0x4d5e6f...",
        signedAt: "2024-01-19T11:20:00Z",
        signedBy: "Compliance Officer B",
      },
      {
        bankId: "BNK002",
        bankName: "Trade Finance Bank",
        approved: true,
        signature: "0x7g8h9i...",
        signedAt: "2024-01-19T13:45:00Z",
        signedBy: "Risk Manager",
      },
      {
        bankId: "BNK003",
        bankName: "International Bank",
        approved: false,
        signature: null,
        signedAt: "2024-01-19T15:10:00Z",
        signedBy: "Compliance Director",
      },
    ],
  },
  {
    id: "3",
    orderId: "ORD-2024-003",
    contractAddress: "0.0.345678",
    clientId: "3",
    clientName: "Premium Commodities Inc",
    clientType: "Producer",
    counterpartyName: "European Traders SA",
    counterpartyBank: "Euro Trade Bank",
    amount: 3200000,
    currency: "HBAR",
    status: "Pending",
    releaseConditions: "Customs clearance, insurance verification, final inspection",
    createdAt: "2024-01-18T16:30:00Z",
    expiresAt: "2024-02-18T16:30:00Z",
    approvals: [
      {
        bankId: "BNK001",
        bankName: "Compliance Bank Ltd",
        approved: null,
        signature: null,
        signedAt: null,
        signedBy: null,
      },
      {
        bankId: "BNK002",
        bankName: "Trade Finance Bank",
        approved: null,
        signature: null,
        signedAt: null,
        signedBy: null,
      },
      {
        bankId: "BNK004",
        bankName: "Euro Trade Bank",
        approved: null,
        signature: null,
        signedAt: null,
        signedBy: null,
      },
    ],
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "Active":
      return (
        <Badge className="bg-chart-5 text-white">
          <Unlock className="w-3 h-3 mr-1" />
          Active
        </Badge>
      )
    case "Pending":
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    case "Released":
      return (
        <Badge className="bg-chart-1 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Released
        </Badge>
      )
    case "Held":
      return (
        <Badge variant="destructive">
          <Lock className="w-3 h-3 mr-1" />
          Held
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getApprovalProgress(approvals: any[]) {
  const approvedCount = approvals.filter((a) => a.approved === true).length
  const rejectedCount = approvals.filter((a) => a.approved === false).length
  const totalCount = approvals.length
  const progress = (approvedCount / totalCount) * 100

  return {
    approved: approvedCount,
    rejected: rejectedCount,
    pending: totalCount - approvedCount - rejectedCount,
    total: totalCount,
    progress,
    canRelease: approvedCount >= 2, // 2-of-3 multisig
  }
}

function EscrowDetailsDialog({ escrow }: { escrow: any }) {
  const approvalStats = getApprovalProgress(escrow.approvals)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Escrow Contract Details</DialogTitle>
          <DialogDescription>Review escrow terms and multisig approval status</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Contract Address</Label>
              <p className="text-sm font-mono mt-1 bg-muted p-2 rounded">{escrow.contractAddress}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Order ID</Label>
              <p className="text-sm font-mono mt-1">{escrow.orderId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Escrow Amount</Label>
              <p className="text-lg font-semibold mt-1">
                {escrow.amount.toLocaleString()} {escrow.currency}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Expires</Label>
              <p className="text-sm mt-1">{new Date(escrow.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Parties */}
          <div>
            <Label className="text-sm font-medium">Trading Parties</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {escrow.clientType === "Producer" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  <span className="font-medium">{escrow.clientName}</span>
                </div>
                <p className="text-sm text-muted-foreground">{escrow.clientType}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">{escrow.counterpartyName}</span>
                </div>
                <p className="text-sm text-muted-foreground">via {escrow.counterpartyBank}</p>
              </div>
            </div>
          </div>

          {/* Release Conditions */}
          <div>
            <Label className="text-sm font-medium">Release Conditions</Label>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{escrow.releaseConditions}</p>
            </div>
          </div>

          {/* Multisig Status */}
          <div>
            <Label className="text-sm font-medium">Multisig Approval Status</Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {approvalStats.approved} of {approvalStats.total} banks approved
                </span>
                <Badge variant={approvalStats.canRelease ? "default" : "secondary"}>
                  {approvalStats.canRelease ? "Can Release" : "Needs More Approvals"}
                </Badge>
              </div>
              <Progress value={approvalStats.progress} className="h-2" />
            </div>
          </div>

          {/* Bank Approvals */}
          <div>
            <Label className="text-sm font-medium">Bank Signatures</Label>
            <div className="mt-2 space-y-2">
              {escrow.approvals.map((approval: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {approval.approved === true ? (
                        <CheckCircle className="w-4 h-4 text-chart-5" />
                      ) : approval.approved === false ? (
                        <XCircle className="w-4 h-4 text-destructive" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{approval.bankName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {approval.signedAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(approval.signedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{approval.signedBy}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">View on Hedera</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EscrowApprovalDialog({
  escrow,
  onApprove,
}: { escrow: any; onApprove: (action: string, reason?: string) => void }) {
  const [action, setAction] = useState<string>("")
  const [reason, setReason] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const currentBankApproval = escrow.approvals.find((a: any) => a.bankId === "BNK001")
  const hasAlreadyApproved = currentBankApproval?.approved !== null

  const handleSubmit = () => {
    onApprove(action, reason)
    setIsOpen(false)
    setAction("")
    setReason("")
    setPrivateKey("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={hasAlreadyApproved}>
          {hasAlreadyApproved ? "Already Signed" : "Sign Escrow"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Escrow Multisig Approval</DialogTitle>
          <DialogDescription>Sign the escrow contract using your bank's private key</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Escrow Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Escrow Amount</span>
              <span className="text-lg font-semibold">
                {escrow.amount.toLocaleString()} {escrow.currency}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contract</span>
              <span className="text-sm font-mono">{escrow.contractAddress}</span>
            </div>
          </div>

          {/* Current Approval Status */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This escrow requires 2-of-3 bank signatures for release. Currently{" "}
              {getApprovalProgress(escrow.approvals).approved} banks have approved.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="action">Approval Decision</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select your decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve Release</SelectItem>
                <SelectItem value="reject">Reject Release</SelectItem>
                <SelectItem value="hold">Place Compliance Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === "approve" && (
            <div>
              <Label htmlFor="privateKey">Bank Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="Enter your bank's Hedera private key..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for cryptographic signature on Hedera network
              </p>
            </div>
          )}

          {(action === "reject" || action === "hold") && (
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder={
                  action === "reject"
                    ? "Provide reason for rejection..."
                    : "Specify compliance concerns requiring hold..."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          {action === "approve" && (
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Your signature will be recorded on the Hedera blockchain and cannot be reversed.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !action ||
              (action === "approve" && !privateKey) ||
              ((action === "reject" || action === "hold") && !reason)
            }
          >
            {action === "approve" ? "Sign & Approve" : "Submit Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function EscrowsPage() {
  const [escrows, setEscrows] = useState(mockEscrows)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredEscrows = escrows.filter((escrow) => {
    const matchesSearch =
      escrow.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escrow.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escrow.contractAddress.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || escrow.status.toLowerCase() === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleApproval = async (escrowId: string, action: string, reason?: string) => {
    // In real app, this would call the API
    console.log(`Escrow Approval: ${action} for escrow ${escrowId}`, reason)

    // Update local state for demo
    setEscrows((prev) =>
      prev.map((escrow) => {
        if (escrow.id === escrowId) {
          const updatedApprovals = escrow.approvals.map((approval) => {
            if (approval.bankId === "BNK001") {
              return {
                ...approval,
                approved: action === "approve" ? true : false,
                signature: action === "approve" ? "0x" + Math.random().toString(16).substr(2, 8) + "..." : null,
                signedAt: new Date().toISOString(),
                signedBy: "Current User",
              }
            }
            return approval
          })

          const approvalStats = getApprovalProgress(updatedApprovals)
          let newStatus = escrow.status

          if (action === "hold") {
            newStatus = "Held"
          } else if (approvalStats.canRelease && action === "approve") {
            newStatus = "Active"
          }

          return {
            ...escrow,
            approvals: updatedApprovals,
            status: newStatus,
          }
        }
        return escrow
      }),
    )
  }

  const statusCounts = {
    all: escrows.length,
    pending: escrows.filter((e) => e.status === "Pending").length,
    active: escrows.filter((e) => e.status === "Active").length,
    released: escrows.filter((e) => e.status === "Released").length,
    held: escrows.filter((e) => e.status === "Held").length,
  }

  const totalValue = escrows.reduce((sum, escrow) => sum + escrow.amount, 0)
  const pendingValue = escrows.filter((e) => e.status === "Pending").reduce((sum, escrow) => sum + escrow.amount, 0)

  return (
    <div className="space-y-6 p-6">
      <BankHeader title="Escrow Management" description="Manage multisig escrow contracts and approvals" />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Escrows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <p className="text-xs text-muted-foreground">{totalValue.toLocaleString()} HBAR total value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground">{pendingValue.toLocaleString()} HBAR pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Escrows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{statusCounts.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Holds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusCounts.held}</div>
          </CardContent>
        </Card>
      </div>

      {/* Escrow Management */}
      <Card>
        <CardHeader>
          <CardTitle>Escrow Contracts</CardTitle>
          <CardDescription>Review and approve multisig escrow releases</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by client, order ID, or contract address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="held">Held</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Escrows Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Multisig Progress</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEscrows.map((escrow) => {
                  const approvalStats = getApprovalProgress(escrow.approvals)
                  return (
                    <TableRow key={escrow.id}>
                      <TableCell>
                        <div>
                          <div className="font-mono text-sm">{escrow.contractAddress}</div>
                          <div className="text-xs text-muted-foreground">{escrow.orderId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {escrow.clientType === "Producer" ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          <div>
                            <div className="font-medium">{escrow.clientName}</div>
                            <div className="text-sm text-muted-foreground">vs {escrow.counterpartyName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {escrow.amount.toLocaleString()} {escrow.currency}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(escrow.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {approvalStats.approved}/{approvalStats.total}
                            </span>
                            <Badge variant={approvalStats.canRelease ? "default" : "secondary"} className="text-xs">
                              {approvalStats.canRelease ? "Ready" : "Pending"}
                            </Badge>
                          </div>
                          <Progress value={approvalStats.progress} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(escrow.expiresAt).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EscrowDetailsDialog escrow={escrow} />
                          <EscrowApprovalDialog
                            escrow={escrow}
                            onApprove={(action, reason) => handleApproval(escrow.id, action, reason)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredEscrows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No escrows found matching your criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

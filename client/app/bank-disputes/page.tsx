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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
} from "lucide-react"

// Mock data - in real app this would come from API
const mockDisputes = [
  {
    id: "1",
    orderId: "ORD-2024-001",
    initiatedBy: "Buyer",
    reason: "Quality does not match specifications",
    status: "Open",
    priority: "High",
    amount: 2500000,
    currency: "HBAR",
    createdAt: "2024-01-20T09:30:00Z",
    producer: {
      name: "ABC Trading Corp",
      type: "Producer",
    },
    buyer: {
      name: "Global Imports Ltd",
      type: "Buyer",
    },
    evidence: [
      {
        id: "1",
        submittedBy: "Buyer",
        documentCid: "QmX1Y2Z3...",
        description: "Quality inspection report showing defects",
        createdAt: "2024-01-20T10:15:00Z",
        fileName: "quality_inspection_report.pdf",
      },
      {
        id: "2",
        submittedBy: "Producer",
        documentCid: "QmA1B2C3...",
        description: "Original quality certificates and manufacturing records",
        createdAt: "2024-01-20T14:30:00Z",
        fileName: "manufacturing_certificates.pdf",
      },
      {
        id: "3",
        submittedBy: "Buyer",
        documentCid: "QmD4E5F6...",
        description: "Photos of received goods showing quality issues",
        createdAt: "2024-01-21T08:45:00Z",
        fileName: "product_photos.zip",
      },
    ],
    rulings: [],
  },
  {
    id: "2",
    orderId: "ORD-2024-002",
    initiatedBy: "Producer",
    reason: "Payment delay beyond agreed terms",
    status: "UnderReview",
    priority: "Medium",
    amount: 1800000,
    currency: "HBAR",
    createdAt: "2024-01-19T11:20:00Z",
    producer: {
      name: "Premium Commodities Inc",
      type: "Producer",
    },
    buyer: {
      name: "European Traders SA",
      type: "Buyer",
    },
    evidence: [
      {
        id: "4",
        submittedBy: "Producer",
        documentCid: "QmG7H8I9...",
        description: "Delivery confirmation and shipping documents",
        createdAt: "2024-01-19T12:00:00Z",
        fileName: "delivery_confirmation.pdf",
      },
      {
        id: "5",
        submittedBy: "Buyer",
        documentCid: "QmJ1K2L3...",
        description: "Bank records showing payment processing delays",
        createdAt: "2024-01-19T16:30:00Z",
        fileName: "payment_records.pdf",
      },
    ],
    rulings: [],
  },
  {
    id: "3",
    orderId: "ORD-2024-003",
    initiatedBy: "Buyer",
    reason: "Goods not delivered within specified timeframe",
    status: "Resolved",
    priority: "Low",
    amount: 950000,
    currency: "HBAR",
    createdAt: "2024-01-15T14:10:00Z",
    producer: {
      name: "International Suppliers Co",
      type: "Producer",
    },
    buyer: {
      name: "Retail Chain Ltd",
      type: "Buyer",
    },
    evidence: [
      {
        id: "6",
        submittedBy: "Buyer",
        documentCid: "QmM4N5O6...",
        description: "Contract showing agreed delivery dates",
        createdAt: "2024-01-15T15:00:00Z",
        fileName: "original_contract.pdf",
      },
    ],
    rulings: [
      {
        id: "1",
        arbitratorId: "ARB001",
        arbitratorName: "Senior Compliance Officer",
        ruling: "PartialRefund",
        amount: 200000,
        reasoning: "Delivery delay justified partial compensation. Producer provided valid reasons for delay.",
        createdAt: "2024-01-18T10:30:00Z",
      },
    ],
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "Open":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Open
        </Badge>
      )
    case "UnderReview":
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Under Review
        </Badge>
      )
    case "Resolved":
      return (
        <Badge className="bg-chart-5 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolved
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "High":
      return <Badge variant="destructive">High</Badge>
    case "Medium":
      return <Badge variant="outline">Medium</Badge>
    case "Low":
      return <Badge variant="secondary">Low</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}

function DisputeDetailsDialog({ dispute }: { dispute: any }) {
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
          <DialogDescription>Complete dispute details and evidence timeline</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence ({dispute.evidence.length})</TabsTrigger>
            {dispute.rulings.length > 0 && <TabsTrigger value="rulings">Rulings</TabsTrigger>}
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

            <div>
              <Label className="text-sm font-medium">Timeline</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Dispute opened: {new Date(dispute.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Evidence submissions: {dispute.evidence.length}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evidence">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {dispute.evidence.map((evidence: any, index: number) => (
                  <div key={evidence.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {evidence.submittedBy === "Producer" ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          <span className="font-medium">{evidence.submittedBy}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Evidence #{index + 1}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(evidence.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm">{evidence.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3" />
                        <span>{evidence.fileName}</span>
                        <span>•</span>
                        <span className="font-mono">{evidence.documentCid}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm">
                        View Document
                      </Button>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {dispute.rulings.length > 0 && (
            <TabsContent value="rulings">
              <div className="space-y-4">
                {dispute.rulings.map((ruling: any) => (
                  <div key={ruling.id} className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Gavel className="w-4 h-4" />
                        <span className="font-medium">Arbitration Ruling</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{new Date(ruling.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <Label className="text-xs">Ruling</Label>
                          <p className="text-sm font-medium">{ruling.ruling.replace(/([A-Z])/g, " $1").trim()}</p>
                        </div>
                        {ruling.amount && (
                          <div>
                            <Label className="text-xs">Amount</Label>
                            <p className="text-sm font-medium">{ruling.amount.toLocaleString()} HBAR</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Reasoning</Label>
                        <p className="text-sm mt-1">{ruling.reasoning}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Arbitrator</Label>
                        <p className="text-sm">{ruling.arbitratorName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ArbitrationDialog({ dispute, onRule }: { dispute: any; onRule: (ruling: any) => void }) {
  const [ruling, setRuling] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [reasoning, setReasoning] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = () => {
    const rulingData = {
      ruling,
      amount: amount ? Number.parseFloat(amount) : null,
      reasoning,
    }
    onRule(rulingData)
    setIsOpen(false)
    setRuling("")
    setAmount("")
    setReasoning("")
  }

  const isResolved = dispute.status === "Resolved"

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
          <DialogDescription>Make a binding decision on this trade dispute</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dispute Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Dispute Amount</span>
              <span className="text-lg font-semibold">
                {dispute.amount.toLocaleString()} {dispute.currency}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Initiated by</span>
              <span className="text-sm">{dispute.initiatedBy}</span>
            </div>
          </div>

          <Alert>
            <Scale className="h-4 w-4" />
            <AlertDescription>
              Your arbitration ruling will be final and recorded on the Hedera blockchain. This decision cannot be
              reversed.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="ruling">Arbitration Decision</Label>
            <Select value={ruling} onValueChange={setRuling}>
              <SelectTrigger>
                <SelectValue placeholder="Select your ruling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PartialRefund">Partial Refund to Buyer</SelectItem>
                <SelectItem value="FullRefund">Full Refund to Buyer</SelectItem>
                <SelectItem value="ReleaseFunds">Release Funds to Producer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(ruling === "PartialRefund" || ruling === "FullRefund") && (
            <div>
              <Label htmlFor="amount">{ruling === "PartialRefund" ? "Refund Amount" : "Full Refund Amount"}</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder={ruling === "FullRefund" ? dispute.amount.toString() : "Enter amount..."}
                  value={ruling === "FullRefund" ? dispute.amount.toString() : amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={ruling === "FullRefund"}
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  {dispute.currency}
                </div>
              </div>
              {ruling === "PartialRefund" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum: {dispute.amount.toLocaleString()} {dispute.currency}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="reasoning">Arbitration Reasoning</Label>
            <Textarea
              id="reasoning"
              placeholder="Provide detailed reasoning for your decision..."
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>

          {ruling && (
            <div className="p-3 border rounded-lg bg-accent/10">
              <div className="flex items-center gap-2 mb-2">
                <Gavel className="w-4 h-4 text-accent" />
                <span className="font-medium">Ruling Summary</span>
              </div>
              <p className="text-sm">
                {ruling === "PartialRefund" && `Partial refund of ${amount || "X"} ${dispute.currency} to buyer`}
                {ruling === "FullRefund" &&
                  `Full refund of ${dispute.amount.toLocaleString()} ${dispute.currency} to buyer`}
                {ruling === "ReleaseFunds" &&
                  `Release full amount of ${dispute.amount.toLocaleString()} ${dispute.currency} to producer`}
              </p>
            </div>
          )}
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
  )
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState(mockDisputes)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.producer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || dispute.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesPriority = priorityFilter === "all" || dispute.priority.toLowerCase() === priorityFilter.toLowerCase()
    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleRuling = async (disputeId: string, rulingData: any) => {
    // In real app, this would call the API
    console.log(`Dispute Ruling: ${rulingData.ruling} for dispute ${disputeId}`, rulingData)

    // Update local state for demo
    setDisputes((prev) =>
      prev.map((dispute) => {
        if (dispute.id === disputeId) {
          const newRuling = {
            id: Date.now().toString(),
            arbitratorId: "ARB001",
            arbitratorName: "Current Arbitrator",
            ruling: rulingData.ruling,
            amount: rulingData.amount,
            reasoning: rulingData.reasoning,
            createdAt: new Date().toISOString(),
          }

          return {
            ...dispute,
            status: "Resolved",
            rulings: [...dispute.rulings, newRuling],
          }
        }
        return dispute
      }),
    )
  }

  const statusCounts = {
    all: disputes.length,
    open: disputes.filter((d) => d.status === "Open").length,
    underreview: disputes.filter((d) => d.status === "UnderReview").length,
    resolved: disputes.filter((d) => d.status === "Resolved").length,
  }

  const totalDisputeValue = disputes
    .filter((d) => d.status !== "Resolved")
    .reduce((sum, dispute) => sum + dispute.amount, 0)

  return (
    <div className="space-y-6 p-6">
      <BankHeader title="Dispute Resolution" description="Arbitrate trade disputes and issue binding rulings" />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <p className="text-xs text-muted-foreground">{totalDisputeValue.toLocaleString()} HBAR at stake</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statusCounts.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{statusCounts.underreview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{statusCounts.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Dispute Management */}
      <Card>
        <CardHeader>
          <CardTitle>Arbitration Dashboard</CardTitle>
          <CardDescription>Review disputes and issue binding arbitration rulings</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by order ID, parties, or reason..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="underreview">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Disputes Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispute</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm">{dispute.orderId}</div>
                        <div className="text-sm text-muted-foreground">{dispute.reason}</div>
                        <div className="text-xs text-muted-foreground">by {dispute.initiatedBy}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-3 h-3" />
                          <span>{dispute.producer.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-3 h-3" />
                          <span>{dispute.buyer.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {dispute.amount.toLocaleString()} {dispute.currency}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{dispute.evidence.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(dispute.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DisputeDetailsDialog dispute={dispute} />
                        <ArbitrationDialog dispute={dispute} onRule={(ruling) => handleRuling(dispute.id, ruling)} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDisputes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No disputes found matching your criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

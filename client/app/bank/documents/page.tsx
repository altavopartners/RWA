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
import { Search, Eye, CheckCircle, XCircle, Clock, FileText, Download, Building2, User, Calendar } from "lucide-react"

// Mock data - in real app this would come from API
const mockDocuments = [
  {
    id: "1",
    orderId: "ORD-2024-001",
    clientId: "1",
    clientName: "ABC Trading Corp",
    clientType: "Producer",
    type: "CoO",
    documentCid: "QmX1Y2Z3...",
    status: "Pending",
    uploadedAt: "2024-01-20T10:30:00Z",
    validatedBy: null,
    validatedAt: null,
    rejectionReason: null,
    fileSize: "2.4 MB",
    fileName: "certificate_of_origin_001.pdf",
  },
  {
    id: "2",
    orderId: "ORD-2024-002",
    clientId: "2",
    clientName: "Global Exports Ltd",
    clientType: "Buyer",
    type: "Insurance",
    documentCid: "QmA1B2C3...",
    status: "Validated",
    uploadedAt: "2024-01-19T14:15:00Z",
    validatedBy: "Compliance Officer",
    validatedAt: "2024-01-19T16:20:00Z",
    rejectionReason: null,
    fileSize: "1.8 MB",
    fileName: "insurance_policy_002.pdf",
  },
  {
    id: "3",
    orderId: "ORD-2024-003",
    clientId: "3",
    clientName: "Premium Commodities Inc",
    clientType: "Producer",
    type: "SanitaryCert",
    documentCid: "QmD4E5F6...",
    status: "Pending",
    uploadedAt: "2024-01-20T09:45:00Z",
    validatedBy: null,
    validatedAt: null,
    rejectionReason: null,
    fileSize: "3.1 MB",
    fileName: "sanitary_certificate_003.pdf",
  },
  {
    id: "4",
    orderId: "ORD-2024-004",
    clientId: "4",
    clientName: "International Buyers Co",
    clientType: "Buyer",
    type: "Invoice",
    documentCid: "QmG7H8I9...",
    status: "Rejected",
    uploadedAt: "2024-01-18T11:20:00Z",
    validatedBy: "Compliance Officer",
    validatedAt: "2024-01-18T15:30:00Z",
    rejectionReason: "Invoice amount does not match order value. Please resubmit with correct amount.",
    fileSize: "0.9 MB",
    fileName: "commercial_invoice_004.pdf",
  },
  {
    id: "5",
    orderId: "ORD-2024-005",
    clientId: "1",
    clientName: "ABC Trading Corp",
    clientType: "Producer",
    type: "CustomsPapers",
    documentCid: "QmJ1K2L3...",
    status: "Pending",
    uploadedAt: "2024-01-20T13:10:00Z",
    validatedBy: null,
    validatedAt: null,
    rejectionReason: null,
    fileSize: "4.2 MB",
    fileName: "customs_declaration_005.pdf",
  },
]

const documentTypes = {
  CoO: { label: "Certificate of Origin", icon: FileText, color: "bg-chart-1" },
  SanitaryCert: { label: "Sanitary Certificate", icon: FileText, color: "bg-chart-2" },
  Insurance: { label: "Insurance Policy", icon: FileText, color: "bg-chart-3" },
  Invoice: { label: "Commercial Invoice", icon: FileText, color: "bg-chart-4" },
  CustomsPapers: { label: "Customs Papers", icon: FileText, color: "bg-chart-5" },
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Validated":
      return (
        <Badge className="bg-chart-5 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Validated
        </Badge>
      )
    case "Pending":
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Pending
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

function DocumentPreviewDialog({ document }: { document: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Document Preview</DialogTitle>
          <DialogDescription>Review document details and metadata</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Document Type</Label>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`w-3 h-3 rounded-full ${documentTypes[document.type as keyof typeof documentTypes]?.color}`}
                ></div>
                <span className="text-sm">{documentTypes[document.type as keyof typeof documentTypes]?.label}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">File Size</Label>
              <p className="text-sm mt-1">{document.fileSize}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Client</Label>
              <div className="flex items-center gap-2 mt-1">
                {document.clientType === "Producer" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span className="text-sm">{document.clientName}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Order ID</Label>
              <p className="text-sm font-mono mt-1">{document.orderId}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Upload Date</Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{new Date(document.uploadedAt).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">IPFS Hash</Label>
            <p className="text-sm font-mono mt-1 bg-muted p-2 rounded">{document.documentCid}</p>
          </div>

          {document.status === "Rejected" && document.rejectionReason && (
            <div>
              <Label className="text-sm font-medium">Rejection Reason</Label>
              <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-sm">{document.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Document Preview Area */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Document Preview</p>
                <p className="text-xs">{document.fileName}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DocumentValidationDialog({
  document,
  onValidate,
}: { document: any; onValidate: (action: string, reason?: string) => void }) {
  const [action, setAction] = useState<string>("")
  const [reason, setReason] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = () => {
    onValidate(action, reason)
    setIsOpen(false)
    setAction("")
    setReason("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={document.status !== "Pending"}>
          {document.status === "Pending" ? "Validate" : "Reviewed"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Document Validation</DialogTitle>
          <DialogDescription>Review and validate or reject this document submission.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${documentTypes[document.type as keyof typeof documentTypes]?.color}`}
              ></div>
              <div>
                <p className="font-medium">{documentTypes[document.type as keyof typeof documentTypes]?.label}</p>
                <p className="text-sm text-muted-foreground">{document.fileName}</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="action">Validation Decision</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select validation decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="validate">Validate Document</SelectItem>
                <SelectItem value="reject">Reject Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === "reject" && (
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Provide detailed reason for rejection..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          {action === "validate" && (
            <div className="p-3 bg-chart-5/10 border border-chart-5/20 rounded">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-chart-5" />
                <p className="text-sm">
                  This document will be marked as validated and logged to Hedera Consensus Service.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!action || (action === "reject" && !reason)}>
            Submit Validation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(mockDocuments)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || doc.status.toLowerCase() === statusFilter
    const matchesType = typeFilter === "all" || doc.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleValidation = async (documentId: string, action: string, reason?: string) => {
    // In real app, this would call the API
    console.log(`Document Validation: ${action} for document ${documentId}`, reason)

    // Update local state for demo
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === documentId) {
          return {
            ...doc,
            status: action === "validate" ? "Validated" : "Rejected",
            validatedBy: "Compliance Officer",
            validatedAt: new Date().toISOString(),
            rejectionReason: action === "reject" ? reason : null,
          }
        }
        return doc
      }),
    )
  }

  const statusCounts = {
    all: documents.length,
    pending: documents.filter((d) => d.status === "Pending").length,
    validated: documents.filter((d) => d.status === "Validated").length,
    rejected: documents.filter((d) => d.status === "Rejected").length,
  }

  const typeCounts = Object.keys(documentTypes).reduce(
    (acc, type) => {
      acc[type] = documents.filter((d) => d.type === type).length
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6 p-6">
      <BankHeader title="Document Validation" description="Review and validate trade documents from clients" />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{statusCounts.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{statusCounts.validated}</div>
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

      {/* Document Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Document Validation Queue</CardTitle>
          <CardDescription>Review and validate uploaded trade documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="queue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="queue">Validation Queue</TabsTrigger>
              <TabsTrigger value="types">By Document Type</TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="space-y-4">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by client, filename, or order ID..."
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
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(documentTypes).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Documents Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${documentTypes[document.type as keyof typeof documentTypes]?.color}`}
                            ></div>
                            <div>
                              <div className="font-medium">
                                {documentTypes[document.type as keyof typeof documentTypes]?.label}
                              </div>
                              <div className="text-sm text-muted-foreground">{document.fileName}</div>
                              <div className="text-xs text-muted-foreground">{document.fileSize}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {document.clientType === "Producer" ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                            <div>
                              <div className="font-medium">{document.clientName}</div>
                              <div className="text-sm text-muted-foreground">{document.clientType}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{document.orderId}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(document.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(document.uploadedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(document.uploadedAt).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DocumentPreviewDialog document={document} />
                            <DocumentValidationDialog
                              document={document}
                              onValidate={(action, reason) => handleValidation(document.id, action, reason)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredDocuments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No documents found matching your criteria.</div>
              )}
            </TabsContent>

            <TabsContent value="types" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(documentTypes).map(([key, type]) => (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                        {type.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{typeCounts[key] || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {documents.filter((d) => d.type === key && d.status === "Pending").length} pending review
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

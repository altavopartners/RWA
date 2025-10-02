"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, CheckCircle, XCircle, Clock, Eye, Download, AlertTriangle, User, Building2 } from "lucide-react"
import type { Document } from "@/types/bank"

interface DocumentVerificationPanelProps {
  documents: Document[]
  onVerifyDocument: (documentId: string, status: "approve" | "reject", reason?: string) => void
}

function DocumentStatusBadge({ status }: { status: Document["status"] }) {
  switch (status) {
    case "VALIDATED":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )
    case "REJECTED":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      )
  }
}

function DocumentVerificationDialog({
  document,
  onVerify,
}: {
  document: Document
  onVerify: (status: "approve" | "reject", reason?: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [action, setAction] = useState<"approve" | "reject" | "">("")
  const [reason, setReason] = useState("")

  const handleSubmit = () => {
    if (!action) return
    onVerify(action, reason)
    setIsOpen(false)
    setAction("")
    setReason("")
  }

  const documentUrl = document.cid ? `https://ipfs.io/ipfs/${document.cid}` : document.url
  const fileExtension = document.filename.split(".").pop()?.toLowerCase()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Review
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Verification</DialogTitle>
          <DialogDescription>Review and verify the submitted document</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Document</span>
              <span className="text-sm font-mono">{document.filename}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Submitted by</span>
              <div className="flex items-center gap-2">
                {document.user.userType === "PRODUCER" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {document.user.fullName} ({document.user.userType})
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm font-medium">{document.documentType || "General Document"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <DocumentStatusBadge status={document.status} />
            </div>
          </div>

          {/* Document Preview */}
          <div>
            <Label className="text-sm font-medium">Document Preview</Label>
            <div className="mt-2 border rounded-lg overflow-hidden">
              {["jpg", "jpeg", "png", "gif"].includes(fileExtension || "") ? (
                <img
                  src={documentUrl || "/placeholder.svg"}
                  alt={document.filename}
                  className="w-full max-h-96 object-contain"
                />
              ) : fileExtension === "pdf" ? (
                <iframe src={documentUrl} title={document.filename} className="w-full h-96" />
              ) : (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                    <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-1" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Verification Actions */}
          <div>
            <Label className="text-sm font-medium">Verification Decision</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={action === "approve" ? "default" : "outline"}
                size="sm"
                onClick={() => setAction("approve")}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Document
              </Button>
              <Button
                variant={action === "reject" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setAction("reject")}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject Document
              </Button>
            </div>
          </div>

          {/* Reason/Notes */}
          <div>
            <Label htmlFor="reason" className="text-sm font-medium">
              {action === "reject" ? "Rejection Reason" : "Verification Notes"}
              {action === "reject" && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="reason"
              placeholder={
                action === "reject"
                  ? "Please specify why this document is being rejected..."
                  : "Add any notes about the verification (optional)..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Verification Guidelines */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Verification Checklist:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Document is clear and legible</li>
                <li>Information matches client details</li>
                <li>Document is current and not expired</li>
                <li>Official stamps/signatures are present (if required)</li>
                <li>Document type matches the requested category</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!action || (action === "reject" && !reason.trim())}>
            {action === "approve" ? "Approve Document" : "Reject Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DocumentVerificationPanel({ documents, onVerifyDocument }: DocumentVerificationPanelProps) {
  const pendingDocuments = documents.filter((doc) => doc.status === "PENDING")
  const verifiedDocuments = documents.filter((doc) => doc.status === "VALIDATED")
  const rejectedDocuments = documents.filter((doc) => doc.status === "REJECTED")

  const handleVerifyDocument = (documentId: string, status: "approve" | "reject", reason?: string) => {
    onVerifyDocument(documentId, status, reason)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{verifiedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Successfully verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{rejectedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Require resubmission</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Document Verification Queue</CardTitle>
          <CardDescription>Review and verify submitted trade documents</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No documents submitted yet.</div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{document.filename}</span>
                        <DocumentStatusBadge status={document.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {document.user.userType === "PRODUCER" ? (
                            <Building2 className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          <span>{document.user.fullName}</span>
                        </div>
                        <span>{document.documentType || "General"}</span>
                        <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                      </div>
                      {document.rejectionReason && (
                        <p className="text-sm text-destructive">Rejected: {document.rejectionReason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={document.cid ? `https://ipfs.io/ipfs/${document.cid}` : document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>

                    {document.status === "PENDING" && (
                      <DocumentVerificationDialog
                        document={document}
                        onVerify={(status, reason) => handleVerifyDocument(document.id, status, reason)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

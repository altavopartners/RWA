"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, User, Building2, Shield, AlertCircle } from "lucide-react"
import type { BankOrder } from "@/types/bank"

interface DocumentRequestDialogProps {
  order: BankOrder
  onRequestDocuments: (orderId: string, partyType: "buyer" | "seller", documentTypes: string[], message: string) => void
}

const DOCUMENT_TYPES = {
  buyer: [
    { id: "kyc_id", label: "KYC Identity Verification", required: true },
    { id: "business_license", label: "Business License", required: true },
    { id: "bank_statement", label: "Bank Statement (Last 3 months)", required: true },
    { id: "trade_license", label: "Import/Export Trade License", required: false },
    { id: "tax_certificate", label: "Tax Registration Certificate", required: false },
    { id: "financial_statement", label: "Financial Statement", required: false },
    { id: "credit_report", label: "Credit Report", required: false },
    { id: "insurance_certificate", label: "Trade Insurance Certificate", required: false },
  ],
  seller: [
    { id: "kyc_id", label: "KYC Identity Verification", required: true },
    { id: "business_license", label: "Business License", required: true },
    { id: "export_license", label: "Export License", required: true },
    { id: "product_certificate", label: "Product Quality Certificate", required: true },
    { id: "organic_cert", label: "Organic Certification", required: false },
    { id: "halal_cert", label: "Halal Certification", required: false },
    { id: "origin_certificate", label: "Certificate of Origin", required: false },
    { id: "phytosanitary", label: "Phytosanitary Certificate", required: false },
    { id: "inspection_report", label: "Pre-shipment Inspection Report", required: false },
    { id: "insurance_certificate", label: "Cargo Insurance Certificate", required: false },
  ],
}

export function DocumentRequestDialog({ order, onRequestDocuments }: DocumentRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [partyType, setPartyType] = useState<"buyer" | "seller">("buyer")
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [message, setMessage] = useState("")

  const handleDocumentToggle = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments((prev) => [...prev, documentId])
    } else {
      setSelectedDocuments((prev) => prev.filter((id) => id !== documentId))
    }
  }

  const handleSubmit = () => {
    if (selectedDocuments.length === 0) return

    onRequestDocuments(order.id, partyType, selectedDocuments, message)
    setIsOpen(false)
    setSelectedDocuments([])
    setMessage("")
  }

  const availableDocuments = DOCUMENT_TYPES[partyType]
  const requiredDocuments = availableDocuments.filter((doc) => doc.required)
  const optionalDocuments = availableDocuments.filter((doc) => !doc.required)

  // Auto-select required documents when party type changes
  const handlePartyTypeChange = (newPartyType: "buyer" | "seller") => {
    setPartyType(newPartyType)
    const required = DOCUMENT_TYPES[newPartyType].filter((doc) => doc.required).map((doc) => doc.id)
    setSelectedDocuments(required)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1" />
          Request Documents
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Trade Documents</DialogTitle>
          <DialogDescription>Request necessary documents from buyer or seller for order verification</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Order ID</span>
              <span className="text-sm font-mono">{order.id}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Client</span>
              <span className="text-sm font-medium">
                {order.user.fullName} ({order.user.userType})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="text-sm font-medium">${order.total?.toLocaleString()}</span>
            </div>
          </div>

          {/* Party Selection */}
          <div>
            <Label className="text-sm font-medium">Request Documents From</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={partyType === "buyer" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePartyTypeChange("buyer")}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Buyer
              </Button>
              <Button
                variant={partyType === "seller" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePartyTypeChange("seller")}
                className="flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Seller
              </Button>
            </div>
          </div>

          {/* Required Documents */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-destructive" />
              <Label className="text-sm font-medium">Required Documents</Label>
              <Badge variant="destructive" className="text-xs">
                Mandatory
              </Badge>
            </div>
            <div className="space-y-2">
              {requiredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={doc.id}
                    checked={selectedDocuments.includes(doc.id)}
                    onCheckedChange={(checked) => handleDocumentToggle(doc.id, checked as boolean)}
                  />
                  <Label
                    htmlFor={doc.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {doc.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Documents */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Additional Documents</Label>
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            </div>
            <div className="space-y-2">
              {optionalDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={doc.id}
                    checked={selectedDocuments.includes(doc.id)}
                    onCheckedChange={(checked) => handleDocumentToggle(doc.id, checked as boolean)}
                  />
                  <Label
                    htmlFor={doc.id}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {doc.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Additional Instructions
            </Label>
            <Textarea
              id="message"
              placeholder="Add any specific requirements or deadlines for document submission..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Document Request Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The {partyType} will be notified via email and in-app notification to submit the requested documents. They
              will have 7 business days to provide all required documents unless otherwise specified.
            </AlertDescription>
          </Alert>

          {/* Selected Documents Summary */}
          {selectedDocuments.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Selected Documents ({selectedDocuments.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedDocuments.map((docId) => {
                  const doc = availableDocuments.find((d) => d.id === docId)
                  return (
                    <Badge key={docId} variant={doc?.required ? "destructive" : "secondary"} className="text-xs">
                      {doc?.label}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={selectedDocuments.length === 0}>
            Send Document Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

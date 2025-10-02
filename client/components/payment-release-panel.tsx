"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
import { Truck, Package, CheckCircle, Shield, AlertTriangle, ExternalLink } from "lucide-react"
import type { BankOrder } from "@/types/bank"

interface PaymentReleaseInfo {
  orderId: string
  totalAmount: number
  currency: string
  releases: Array<{
    id: string
    type: "PARTIAL50" | "FULL100"
    amount: number
    released: boolean
    transactionId?: string
    releasedAt?: string
    trigger: string
    status: "pending" | "ready" | "released" | "failed"
  }>
  escrowAddress?: string
  shipmentTrackingId?: string
  buyerBankApproved: boolean
  sellerBankApproved: boolean
}

interface PaymentReleasePanelProps {
  order: BankOrder
  onConfirmShipment: (orderId: string, trackingId: string, notes?: string) => void
  onConfirmDelivery: (orderId: string, notes?: string) => void
}

function PaymentReleaseDialog({
  order,
  releaseType,
  onConfirm,
}: {
  order: BankOrder
  releaseType: "shipment" | "delivery"
  onConfirm: (trackingId?: string, notes?: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [trackingId, setTrackingId] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    onConfirm(releaseType === "shipment" ? trackingId : undefined, notes)
    setIsOpen(false)
    setTrackingId("")
    setNotes("")
  }

  const releaseAmount = Number(order.total) * 0.5

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={releaseType === "shipment" ? "default" : "outline"}
          size="sm"
          disabled={
            releaseType === "shipment" ? order.status !== "banks_approved" : order.status !== "shipped_50_released"
          }
        >
          {releaseType === "shipment" ? (
            <>
              <Truck className="h-4 w-4 mr-1" />
              Confirm Shipment
            </>
          ) : (
            <>
              <Package className="h-4 w-4 mr-1" />
              Confirm Delivery
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{releaseType === "shipment" ? "Confirm Shipment" : "Confirm Delivery"}</DialogTitle>
          <DialogDescription>
            {releaseType === "shipment"
              ? "Confirm shipment to release 50% of escrowed funds to seller"
              : "Confirm delivery to release remaining 50% of escrowed funds"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Release Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Release Amount</span>
              <span className="text-lg font-semibold text-green-600">${releaseAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Order Total</span>
              <span className="text-sm font-medium">${Number(order.total).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Release Type</span>
              <Badge variant={releaseType === "shipment" ? "default" : "secondary"}>
                {releaseType === "shipment" ? "50% on Shipment" : "50% on Delivery"}
              </Badge>
            </div>
          </div>

          {/* Tracking ID for Shipment */}
          {releaseType === "shipment" && (
            <div>
              <Label htmlFor="trackingId" className="text-sm font-medium">
                Shipment Tracking ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="trackingId"
                placeholder="Enter tracking number..."
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be shared with the buyer for shipment tracking
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              placeholder={
                releaseType === "shipment"
                  ? "Add any shipment details or special instructions..."
                  : "Add any delivery confirmation details..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Confirmation Alert */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Confirmation Required:</strong> This action will trigger an immediate payment release of $
              {releaseAmount.toLocaleString()} from the Hedera escrow to the seller's account. This action cannot be
              undone.
            </AlertDescription>
          </Alert>

          {/* Escrow Info */}
          {order.escrowAddress && (
            <div className="text-xs text-muted-foreground">
              <span>Escrow Contract: </span>
              <span className="font-mono">{order.escrowAddress}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={releaseType === "shipment" && !trackingId.trim()}>
            {releaseType === "shipment" ? "Confirm Shipment & Release 50%" : "Confirm Delivery & Release Final 50%"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaymentReleaseTimeline({ order }: { order: BankOrder }) {
  const getTimelineSteps = () => {
    const steps = [
      {
        id: "banks_approved",
        title: "Banks Approved",
        description: "Both banks have approved the trade",
        status: order.buyerBankApproved && order.sellerBankApproved ? "completed" : "pending",
        amount: 0,
        icon: <Shield className="h-4 w-4" />,
      },
      {
        id: "shipment_confirmed",
        title: "Shipment Confirmed",
        description: "50% payment released to seller",
        status:
          order.status === "shipped_50_released" ||
          order.status === "received_100_released" ||
          order.status === "completed"
            ? "completed"
            : order.status === "banks_approved"
              ? "ready"
              : "pending",
        amount: Number(order.total) * 0.5,
        icon: <Truck className="h-4 w-4" />,
      },
      {
        id: "delivery_confirmed",
        title: "Delivery Confirmed",
        description: "Final 50% payment released",
        status:
          order.status === "received_100_released" || order.status === "completed"
            ? "completed"
            : order.status === "shipped_50_released"
              ? "ready"
              : "pending",
        amount: Number(order.total) * 0.5,
        icon: <Package className="h-4 w-4" />,
      },
    ]

    return steps
  }

  const steps = getTimelineSteps()
  const completedSteps = steps.filter((step) => step.status === "completed").length
  const progress = (completedSteps / steps.length) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Payment Release Timeline</h4>
        <Badge variant="outline">
          {completedSteps}/{steps.length} Complete
        </Badge>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div
              className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2 
              ${
                step.status === "completed"
                  ? "bg-green-100 border-green-500 text-green-700"
                  : step.status === "ready"
                    ? "bg-blue-100 border-blue-500 text-blue-700"
                    : "bg-gray-100 border-gray-300 text-gray-500"
              }
            `}
            >
              {step.status === "completed" ? <CheckCircle className="h-4 w-4" /> : step.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">{step.title}</h5>
                {step.amount > 0 && (
                  <span
                    className={`
                    text-sm font-medium
                    ${step.status === "completed" ? "text-green-600" : "text-muted-foreground"}
                  `}
                  >
                    ${step.amount.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>

              {step.status === "ready" && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Ready for confirmation
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PaymentReleasePanel({ order, onConfirmShipment, onConfirmDelivery }: PaymentReleasePanelProps) {
  const totalAmount = Number(order.total)
  const releasedAmount =
    order.status === "shipped_50_released"
      ? totalAmount * 0.5
      : order.status === "received_100_released" || order.status === "completed"
        ? totalAmount
        : 0
  const pendingAmount = totalAmount - releasedAmount

  const handleShipmentConfirm = (trackingId?: string, notes?: string) => {
    if (trackingId) {
      onConfirmShipment(order.id, trackingId, notes)
    }
  }

  const handleDeliveryConfirm = (notes?: string) => {
    onConfirmDelivery(order.id, notes)
  }

  return (
    <div className="space-y-6">
      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Escrow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Locked in Hedera escrow</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Released</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${releasedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((releasedAmount / totalAmount) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Release Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Release Schedule</CardTitle>
          <CardDescription>50% releases on shipment confirmation, 50% on delivery confirmation</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentReleaseTimeline order={order} />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Release Actions</CardTitle>
          <CardDescription>Confirm milestones to trigger automatic payment releases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <PaymentReleaseDialog order={order} releaseType="shipment" onConfirm={handleShipmentConfirm} />

            <PaymentReleaseDialog order={order} releaseType="delivery" onConfirm={handleDeliveryConfirm} />

            {order.escrowAddress && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://hashscan.io/testnet/contract/${order.escrowAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View on Hedera
                </a>
              </Button>
            )}
          </div>

          {/* Current Status Alert */}
          <div className="mt-4">
            {order.status === "banks_approved" && (
              <Alert>
                <Truck className="h-4 w-4" />
                <AlertDescription>
                  Both banks have approved this order. Ready to confirm shipment and release 50% payment.
                </AlertDescription>
              </Alert>
            )}

            {order.status === "shipped_50_released" && (
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  Shipment confirmed and 50% payment released. Waiting for delivery confirmation to release final 50%.
                  {order.shipmentTrackingId && (
                    <span className="block mt-1">
                      Tracking ID: <span className="font-mono">{order.shipmentTrackingId}</span>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {order.status === "received_100_released" && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Delivery confirmed and final 50% payment released. Order completed successfully.
                </AlertDescription>
              </Alert>
            )}

            {!order.buyerBankApproved ||
              (!order.sellerBankApproved && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Waiting for dual-bank approval before payment release can begin. Buyer Bank:{" "}
                    {order.buyerBankApproved ? "✓ Approved" : "⏳ Pending"}
                    {" | "}
                    Seller Bank: {order.sellerBankApproved ? "✓ Approved" : "⏳ Pending"}
                  </AlertDescription>
                </Alert>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      {order.hederaTransactionId && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Hedera blockchain transaction records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">Escrow Initialization</span>
                <span className="text-xs font-mono">{order.hederaTransactionId}</span>
              </div>

              {order.status === "shipped_50_released" && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">50% Payment Released</span>
                  <span className="text-xs font-mono">release-50-{order.id}</span>
                </div>
              )}

              {(order.status === "received_100_released" || order.status === "completed") && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Final 50% Payment Released</span>
                  <span className="text-xs font-mono">release-100-{order.id}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

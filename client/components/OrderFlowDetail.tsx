"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Truck, CheckCircle, Clock, Package, Shield, AlertCircle, MapPin, DollarSign, FileCheck, Lock, Image as ImageIcon } from "lucide-react";
import type { Order } from "./OrderFlow";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/$/, "");

type Props = {
  order: Order;
  loadingDetail?: boolean;
  onConfirmDelivery?: () => void;
  onDispute?: () => void;
};

const fmt = (n: number | string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n));

const toNumber = (n: any, d = 0) => {
  const v = typeof n === "string" ? Number.parseFloat(n) : Number(n);
  return Number.isFinite(v) ? v : d;
};

// récupère la première image (array d’objets {path}) et construit l’URL
const pickFirstImageUrl = (images: any): string | null => {
  if (!images) return null;
  if (Array.isArray(images) && images.length && images[0]?.path) {
    return `${API_BASE}${images[0].path}`;
  }
  if (typeof images === "string") return images;
  if (Array.isArray(images) && typeof images[0] === "string") return images[0];
  if (typeof images === "object" && images.path) return `${API_BASE}${images.path}`;
  return null;
};

export default function OrderFlowDetail({ order, loadingDetail, onConfirmDelivery, onDispute }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "bank_verification":
        return "bg-warning";
      case "ready_for_shipment":
        return "bg-info";
      case "in_transit":
        return "bg-info";
      case "delivered":
        return "bg-success";
      case "disputed":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "bank_verification":
        return Shield;
      case "ready_for_shipment":
        return Package;
      case "in_transit":
        return Truck;
      case "delivered":
        return CheckCircle;
      case "disputed":
        return AlertCircle;
      default:
        return Clock;
    }
  };
    const labelFor = (s: string) => {
    if (!s) return "";
    const clean = s.replace(/_/g, " ").toLowerCase(); // "AWAITING_PAYMENT" -> "awaiting payment"
    return clean.charAt(0).toUpperCase() + clean.slice(1); // "awaiting payment" -> "Awaiting payment"
    };
  const getBankStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-success text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-info text-white">
            <FileCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "documents_submitted":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        );
      case "pending_documents":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Docs Needed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const StatusIcon = getStatusIcon(order.status);

  const itemsCount = order.items?.length || 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main Order Info */}
      <div className="xl:col-span-2 space-y-6">
        {/* Header */}
        <Card className="glass border-border/50 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{order.orderId}</h2>
              <p className="text-sm text-muted-foreground">
                {itemsCount} item{itemsCount > 1 ? "s" : ""} in this order
              </p>
            </div>
            <Badge variant="outline" className={`${getStatusColor(order.status)}`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {labelFor(order.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-semibold">{fmt(order.subtotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shipping</p>
              <p className="font-semibold">{fmt(order.shipping)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold ">{fmt(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="font-semibold">
                {order.progress}%
                {loadingDetail && <span className="text-xs text-muted-foreground ml-2">(updating…)</span>}
              </p>
            </div>
          </div>

          <Progress value={order.progress} className="mb-4" />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Ordered: {order.orderDate ? new Date(order.orderDate).toLocaleString() : "—"}</span>
            <span>Est. Delivery: {order.estimatedDelivery ?? "—"}</span>
          </div>
        </Card>

        {/* ALL items */}
        <Card className="glass border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          <div className="divide-y">
            {(order.items || []).map((it) => {
              const product: any = it.product || {};
              const name = product?.name ?? "Product";
              const unit = product?.unit ? ` ${product.unit}` : "";
              const imgUrl = pickFirstImageUrl(product?.images);

              const qty = toNumber(it.quantity, 0);
              const unitPrice = toNumber(it.unitPrice, 0);
              const lineTotal = toNumber(it.lineTotal, qty * unitPrice);

              return (
                <div key={it.id} className="py-4 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden">
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: <span className="font-medium">{qty}{unit}</span> · Unit:{" "}
                      <span className="font-medium">{fmt(unitPrice)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Line Total</p>
                    <p className="font-semibold">{fmt(lineTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totaux récap */}
          <div className="mt-6 border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">{fmt(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{fmt(order.totalAmount)}</span>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        {/* <Card className="glass border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            Order Timeline
          </h3>

          <div className="space-y-4">
            {order.milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${milestone.completed ? "bg-success" : "bg-muted"}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${milestone.completed ? "text-foreground" : "text-muted-foreground"}`}>{milestone.stage}</h4>
                    {milestone.date && <span className="text-sm text-muted-foreground">{milestone.date}</span>}
                  </div>
                  {milestone.description && <p className="text-sm text-muted-foreground">{milestone.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card> */}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Escrow Details */}
        <Card className="glass border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Hedera Escrow Details
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Escrow Amount</p>
              <p className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                {fmt(order.totalAmount)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Payment Schedule</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>On Bank Approval:</span><span className="font-medium">{order.paymentSchedule.onApproval}%</span></div>
                <div className="flex justify-between"><span>On Shipment:</span><span className="font-medium text-warning">{order.paymentSchedule.onShipment}%</span></div>
                <div className="flex justify-between"><span>On Delivery:</span><span className="font-medium text-success">{order.paymentSchedule.onDelivery}%</span></div>
              </div>
            </div>

            {order.escrowContract && (
              <div>
                <p className="text-sm text-muted-foreground">Hedera Contract</p>
                <p className="font-mono text-sm break-all">{order.escrowContract}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Escrow Status</p>
              <div className="flex items-center gap-2">
                {false ? ( // adapte si tu as de vrais statuts banques
                  <>
                    <Lock className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">Funds Secured & Active</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-sm text-warning">Pending Bank Approval</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="glass border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full bg-transparent">
              <MapPin className="w-4 h-4 mr-2" />
              Track Package
            </Button>
            <Button variant="outline" className="w-full bg-transparent">
              <FileCheck className="w-4 h-4 mr-2" />
              View Certificate
            </Button>
            <Button variant="destructive" className="w-full" onClick={onDispute}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Open Dispute
            </Button>
          </div>
        </Card>

        {/* Producer */}
        <Card className="glass border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Producer</h3>
          <div className="space-y-3">
            <div>
              <p className="font-medium">{order.producer}</p>
              <p className="text-sm text-muted-foreground">Verified Producer</p>
            </div>
            {order.producerAddress && (
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-sm break-all">{order.producerAddress}</p>
              </div>
            )}
            <Button variant="outline" className="w-full bg-transparent">
              <DollarSign className="w-4 h-4 mr-2" />
              Contact Producer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

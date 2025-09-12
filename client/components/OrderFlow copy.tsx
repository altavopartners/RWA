"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Lock,
  Truck,
  CheckCircle,
  Clock,
  Package,
  Shield,
  AlertCircle,
  MapPin,
  DollarSign,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnect } from "@/hooks/useWalletConnect";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

type BankStatus = "approved" | "verified" | "documents_submitted" | "pending_documents" | string;

type OrderMilestone = {
  stage: string;
  completed: boolean;
  date: string | null;
  description?: string;
};

type Order = {
  id: string;
  orderId: string;
  productName: string;
  producer: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  escrowAmount: number;
  status:
    | "bank_verification"
    | "ready_for_shipment"
    | "in_transit"
    | "delivered"
    | "disputed"
    | string;
  progress: number;
  orderDate: string;
  estimatedDelivery: string | null;
  trackingNumber: string | null;
  buyerAddress?: string;
  producerAddress?: string;
  escrowContract?: string;
  buyerBank: {
    id?: string;
    name?: string;
    status: BankStatus;
    documentsRequested: string[];
    lastUpdate?: string;
  };
  sellerBank: {
    id?: string;
    name?: string;
    status: BankStatus;
    documentsRequested: string[];
    lastUpdate?: string;
  };
  paymentSchedule: {
    onApproval: number;
    onShipment: number;
    onDelivery: number;
  };
  milestones: OrderMilestone[];
};

function toNumber(n: any, d = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : d;
}

function pctClamp(n: any, d = 0) {
  const v = toNumber(n, d);
  return Math.max(0, Math.min(100, v));
}

function useToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jwtToken");
}

export default function OrderFlow() {
  const { isConnected } = useAuth();
  const { triggerConnect } = useWalletConnect();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const token = useToken();

  // --- Normalizers (accept flexible backend shapes like in Cart) ---
  const normalizeMilestones = useCallback((raw: any[]): OrderMilestone[] => {
    const rows = Array.isArray(raw) ? raw : [];
    return rows.map((m) => ({
      stage: m.stage ?? m.title ?? "Step",
      completed: Boolean(m.completed ?? m.done ?? false),
      date: m.date ?? m.completedAt ?? null,
      description: m.description ?? m.desc ?? undefined,
    }));
  }, []);

  const normalizeBank = useCallback((b: any) => {
    const r = b && typeof b === "object" ? b : {};
    return {
      id: r.id ?? r.bankId ?? undefined,
      name: r.name ?? r.bankName ?? undefined,
      status:
        r.status ??
        (r.approved ? "approved" : r.verified ? "verified" : "documents_submitted"),
      documentsRequested:
        (Array.isArray(r.documentsRequested) && r.documentsRequested) ||
        (Array.isArray(r.docs) && r.docs) ||
        [],
      lastUpdate: r.lastUpdate ?? r.updatedAt ?? undefined,
    };
  }, []);

  const normalizeOrder = useCallback(
    (row: any): Order => {
      const id =
        row.id ??
        row._id ??
        row.orderId ??
        row.reference ??
        Math.random().toString(36).slice(2);

      const qty = toNumber(row.quantity ?? row.qty ?? row.amount ?? 0, 0);
      const unit = toNumber(row.unitPrice ?? row.pricePerUnit ?? row.price ?? 0, 0);
      const total =
        toNumber(row.totalAmount ?? row.total ?? qty * unit, qty * unit);

      const escrow = toNumber(row.escrowAmount ?? row.escrow ?? total, total);

      const status =
        row.status ??
        (row.bankVerified === false
          ? "bank_verification"
          : row.shipped
          ? "in_transit"
          : "ready_for_shipment");

      const milestones = normalizeMilestones(row.milestones ?? row.timeline ?? []);

      const paymentSchedule = {
        onApproval: pctClamp(row.paymentSchedule?.onApproval ?? 0),
        onShipment: pctClamp(row.paymentSchedule?.onShipment ?? 50),
        onDelivery: pctClamp(row.paymentSchedule?.onDelivery ?? 50),
      };

      const buyerBank = normalizeBank(row.buyerBank ?? row.buyer?.bank ?? {});
      const sellerBank = normalizeBank(row.sellerBank ?? row.seller?.bank ?? {});

      // Rough progress heuristic if backend doesn't send one
      const progress =
        pctClamp(
          row.progress ??
            (status === "bank_verification"
              ? 40
              : status === "ready_for_shipment"
              ? 60
              : status === "in_transit"
              ? 80
              : status === "delivered"
              ? 100
              : 20)
        );

      return {
        id: String(id),
        orderId: row.orderId ?? row.reference ?? String(id),
        productName:
          row.productName ??
          row.product?.name ??
          row.item?.name ??
          row.title ??
          "Product",
        producer: row.producer ?? row.seller?.name ?? "Producer",
        quantity: qty,
        unitPrice: unit,
        totalAmount: total,
        escrowAmount: escrow,
        status,
        progress,
        orderDate: row.orderDate ?? row.createdAt ?? "",
        estimatedDelivery: row.estimatedDelivery ?? row.eta ?? null,
        trackingNumber: row.trackingNumber ?? row.tracking ?? null,
        buyerAddress: row.buyerAddress ?? row.buyer?.address ?? undefined,
        producerAddress: row.producerAddress ?? row.seller?.address ?? undefined,
        escrowContract: row.escrowContract ?? row.escrow?.contract ?? undefined,
        buyerBank,
        sellerBank,
        paymentSchedule,
        milestones,
      };
    },
    [normalizeBank, normalizeMilestones]
  );

  const normalizeList = useCallback(
    (raw: any): Order[] => {
      const rows: any[] =
        (Array.isArray(raw) && raw) ||
        (Array.isArray(raw?.orders) && raw.orders) ||
        (Array.isArray(raw?.data) && raw.data) ||
        (raw && typeof raw === "object" ? [raw] : []);
      return rows.map(normalizeOrder);
    },
    [normalizeOrder]
  );

  // --- Fetchers ---
  const fetchOrders = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/orders/get-all-my-orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      const txt = await res.text();
      let data: any = {};
      try {
        data = txt ? JSON.parse(txt) : {};
      } catch {
        if (!res.ok) throw new Error(txt || "Failed to fetch orders");
      }

      if (!res.ok) {
        const message =
          (typeof data?.message === "string" && data.message) ||
          (typeof data?.error === "string" && data.error) ||
          txt ||
          "Failed to fetch orders";
        throw new Error(message);
      }

      const list = normalizeList(data);
      setOrders(list);
      if (!selectedId && list.length) setSelectedId(list[0].id);
      setLastFetchedAt(Date.now());
    } catch (e: any) {
      console.error(e);
      setOrders([]);
      setSelectedId(null);
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [isConnected, token, selectedId, normalizeList]);

  const fetchOrderDetail = useCallback(
    async (id: string) => {
      if (!isConnected || !id) return;
      setLoadingDetail(true);
      try {
        const res = await fetch(`${API_BASE}/api/orders/get-my-order/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        const txt = await res.text();
        let data: any = {};
        try {
          data = txt ? JSON.parse(txt) : {};
        } catch {
          if (!res.ok) throw new Error(txt || "Failed to fetch order detail");
        }

        if (!res.ok) {
          const message =
            (typeof data?.message === "string" && data.message) ||
            (typeof data?.error === "string" && data.error) ||
            txt ||
            "Failed to fetch order detail";
          throw new Error(message);
        }

        const normalized = normalizeList(data);
        // Replace/merge the specific order
        setOrders((prev) => {
          const map = new Map(prev.map((o) => [o.id, o]));
          if (normalized.length === 1) {
            map.set(normalized[0].id, normalized[0]);
          } else {
            normalized.forEach((o) => map.set(o.id, o));
          }
          return Array.from(map.values());
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetail(false);
      }
    },
    [isConnected, token, normalizeList]
  );

  useEffect(() => {
    if (!isConnected) {
      triggerConnect();
      return;
    }
    fetchOrders();
  }, [isConnected, triggerConnect, fetchOrders]);

  // --- UI helpers (kept from your original component) ---
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

  const currentOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) || null,
    [orders, selectedId]
  );

  // --- Actions (no-op placeholders for now) ---
  const handleConfirmDelivery = () => {
    console.log("Confirming delivery and releasing escrow...");
  };

  const handleDispute = () => {
    console.log("Opening dispute resolution...");
  };

  if (!isConnected) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Orders Access Required</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to view your orders.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">
              Track your orders and manage escrow payments
            </p>
          </div>
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading orders…</p>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedId(order.id);
                          fetchOrderDetail(order.id);
                        }}
                        className={`p-4 rounded-lg cursor-pointer transition-smooth border ${
                          selectedId === order.id
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {order.orderId}
                          </span>
                          <StatusIcon className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {order.productName}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={getStatusColor(order.status)}
                          >
                            {String(order.status).replace("_", " ")}
                          </Badge>
                          <span className="text-sm font-medium ">
                            ${order.totalAmount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {lastFetchedAt && (
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(lastFetchedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-3">
            {!currentOrder ? (
              <Card className="glass border-border/50 p-6">
                <p className="text-muted-foreground text-sm">
                  Select an order to view details.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Order Info */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Order Header */}
                  <Card className="glass border-border/50 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">
                          {currentOrder.orderId}
                        </h2>
                        <p className="text-muted-foreground">
                          {currentOrder.productName}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(
                          currentOrder.status
                        )} text-white`}
                      >
                        {(() => {
                          const Icon = getStatusIcon(currentOrder.status);
                          return <Icon className="w-4 h-4 mr-2" />;
                        })()}
                        {String(currentOrder.status).replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-semibold">
                          {currentOrder.quantity} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Unit Price
                        </p>
                        <p className="font-semibold">${currentOrder.unitPrice}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Amount
                        </p>
                        <p className="font-semibold ">
                          ${currentOrder.totalAmount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Progress</p>
                        <p className="font-semibold">
                          {currentOrder.progress}%
                          {loadingDetail && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (updating…)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Progress value={currentOrder.progress} className="mb-4" />

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Ordered: {currentOrder.orderDate}</span>
                      <span>
                        Est. Delivery: {currentOrder.estimatedDelivery ?? "—"}
                      </span>
                    </div>
                  </Card>

                  {/* Tracking Timeline */}
                  <Card className="glass border-border/50 p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      Order Timeline
                    </h3>

                    <div className="space-y-4">
                      {currentOrder.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div
                            className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${
                              milestone.completed ? "bg-success" : "bg-muted"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4
                                className={`font-medium ${
                                  milestone.completed
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {milestone.stage}
                              </h4>
                              {milestone.date && (
                                <span className="text-sm text-muted-foreground">
                                  {milestone.date}
                                </span>
                              )}
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground">
                                {milestone.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {currentOrder.trackingNumber && (
                      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium mb-1">
                          Tracking Number
                        </p>
                        <p className="font-mono text-sm">
                          {currentOrder.trackingNumber}
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* Bank Approval Status */}
                  {(currentOrder.status === "bank_verification" ||
                    currentOrder.status === "ready_for_shipment") && (
                    <Card className="glass border-border/50 p-6">
                      <h3 className="text-lg font-semibold mb-6 flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Dual-Bank Approval Status
                      </h3>

                      <div className="space-y-4">
                        {/* Buyer's Bank */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">Buyer's Bank</h4>
                              {currentOrder.buyerBank.name && (
                                <p className="text-sm text-muted-foreground">
                                  {currentOrder.buyerBank.name}
                                </p>
                              )}
                            </div>
                            {getBankStatusBadge(currentOrder.buyerBank.status)}
                          </div>

                          {currentOrder.buyerBank.documentsRequested.length >
                            0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">
                                Required Documents:
                              </p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {currentOrder.buyerBank.documentsRequested.map(
                                  (doc, index) => (
                                    <li
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                                      {doc}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {currentOrder.buyerBank.lastUpdate && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Last updated: {currentOrder.buyerBank.lastUpdate}
                            </p>
                          )}
                        </div>

                        {/* Seller's Bank */}
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">Seller's Bank</h4>
                              {currentOrder.sellerBank.name && (
                                <p className="text-sm text-muted-foreground">
                                  {currentOrder.sellerBank.name}
                                </p>
                              )}
                            </div>
                            {getBankStatusBadge(currentOrder.sellerBank.status)}
                          </div>

                          {currentOrder.sellerBank.documentsRequested.length >
                            0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">
                                Required Documents:
                              </p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {currentOrder.sellerBank.documentsRequested.map(
                                  (doc, index) => (
                                    <li
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                                      {doc}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {currentOrder.sellerBank.lastUpdate && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Last updated: {currentOrder.sellerBank.lastUpdate}
                            </p>
                          )}
                        </div>

                        {/* Overall Status */}
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm">
                            {currentOrder.buyerBank.status === "approved" &&
                            currentOrder.sellerBank.status === "approved"
                              ? "✅ Both banks approved - escrow active and ready for shipment"
                              : "⏳ Waiting for both banks to complete verification and approval process"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
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
                        <p className="text-sm text-muted-foreground">
                          Total Escrow Amount
                        </p>
                        <p className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                          ${currentOrder.escrowAmount}
                        </p>
                      </div>

                      {/* Payment Schedule */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Payment Schedule
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>On Bank Approval:</span>
                            <span className="font-medium">
                              {currentOrder.paymentSchedule.onApproval}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>On Shipment:</span>
                            <span className="font-medium text-warning">
                              {currentOrder.paymentSchedule.onShipment}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>On Delivery:</span>
                            <span className="font-medium text-success">
                              {currentOrder.paymentSchedule.onDelivery}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {currentOrder.escrowContract && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Hedera Contract
                          </p>
                          <p className="font-mono text-sm break-all">
                            {currentOrder.escrowContract}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Escrow Status
                        </p>
                        <div className="flex items-center gap-2">
                          {currentOrder.buyerBank.status === "approved" &&
                          currentOrder.sellerBank.status === "approved" ? (
                            <>
                              <Lock className="w-4 h-4 text-success" />
                              <span className="text-sm text-success">
                                Funds Secured & Active
                              </span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-warning" />
                              <span className="text-sm text-warning">
                                Pending Bank Approval
                              </span>
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
                      {currentOrder.status === "in_transit" && (
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={handleConfirmDelivery}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Delivery
                        </Button>
                      )}

                      <Button variant="outline" className="w-full bg-transparent">
                        <MapPin className="w-4 h-4 mr-2" />
                        Track Package
                      </Button>

                      <Button variant="outline" className="w-full bg-transparent">
                        <FileCheck className="w-4 h-4 mr-2" />
                        View Certificate
                      </Button>

                      {currentOrder.status !== "delivered" && (
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={handleDispute}
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Open Dispute
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Producer Info */}
                  <Card className="glass border-border/50 p-6">
                    <h3 className="text-lg font-semibold mb-4">Producer</h3>

                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">{currentOrder.producer}</p>
                        <p className="text-sm text-muted-foreground">
                          Verified Producer
                        </p>
                      </div>

                      {currentOrder.producerAddress && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Wallet Address
                          </p>
                          <p className="font-mono text-sm break-all">
                            {currentOrder.producerAddress}
                          </p>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

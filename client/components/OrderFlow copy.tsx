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

type BankStatus =
  | "approved"
  | "verified"
  | "documents_submitted"
  | "pending_documents"
  | string;

type OrderMilestone = {
  stage: string;
  completed: boolean;
  date: string | null;
  description?: string;
};

type OrderStatus =
  | "AWAITING_PAYMENT"
  | "BANK_REVIEW"
  | "READY_FOR_SHIPMENT"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "DISPUTED"
  | "CANCELLED"
  | string;

type Order = {
  id: string;
  orderId: string;
  productName: string;
  producer: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  escrowAmount: number;
  status: OrderStatus;
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
  const token = useToken();

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
        (r.approved
          ? "approved"
          : r.verified
          ? "verified"
          : "documents_submitted"),
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
      const unit = toNumber(
        row.unitPrice ?? row.pricePerUnit ?? row.price ?? 0,
        0
      );
      const total = toNumber(
        row.totalAmount ?? row.total ?? qty * unit,
        qty * unit
      );
      const escrow = toNumber(row.escrowAmount ?? row.escrow ?? total, total);

      let status: OrderStatus = "AWAITING_PAYMENT";
      if (row.status) {
        const s = String(row.status).toUpperCase();
        if (
          [
            "AWAITING_PAYMENT",
            "BANK_REVIEW",
            "READY_FOR_SHIPMENT",
            "IN_TRANSIT",
            "DELIVERED",
            "DISPUTED",
            "CANCELLED",
          ].includes(s)
        ) {
          status = s as OrderStatus;
        }
      } else if (row.bankVerified === false) {
        status = "BANK_REVIEW";
      } else if (row.shipped) {
        status = "IN_TRANSIT";
      } else if (row.readyForShipment) {
        status = "READY_FOR_SHIPMENT";
      }

      const milestones = normalizeMilestones(
        row.milestones ?? row.timeline ?? []
      );

      const paymentSchedule = {
        onApproval: pctClamp(row.paymentSchedule?.onApproval ?? 0),
        onShipment: pctClamp(row.paymentSchedule?.onShipment ?? 50),
        onDelivery: pctClamp(row.paymentSchedule?.onDelivery ?? 50),
      };

      const buyerBank = normalizeBank(row.buyerBank ?? row.buyer?.bank ?? {});
      const sellerBank = normalizeBank(
        row.sellerBank ?? row.seller?.bank ?? {}
      );

      const progress = pctClamp(
        row.progress ??
          (status === "AWAITING_PAYMENT"
            ? 20
            : status === "BANK_REVIEW"
            ? 40
            : status === "READY_FOR_SHIPMENT"
            ? 60
            : status === "IN_TRANSIT"
            ? 80
            : status === "DELIVERED"
            ? 100
            : 0)
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
        producerAddress:
          row.producerAddress ?? row.seller?.address ?? undefined,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AWAITING_PAYMENT":
        return "bg-yellow-500";
      case "BANK_REVIEW":
        return "bg-blue-500";
      case "READY_FOR_SHIPMENT":
        return "bg-indigo-500";
      case "IN_TRANSIT":
        return "bg-purple-500";
      case "DELIVERED":
        return "bg-green-500";
      case "DISPUTED":
        return "bg-red-500";
      case "CANCELLED":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AWAITING_PAYMENT":
        return DollarSign;
      case "BANK_REVIEW":
        return Shield;
      case "READY_FOR_SHIPMENT":
        return Package;
      case "IN_TRANSIT":
        return Truck;
      case "DELIVERED":
        return CheckCircle;
      case "DISPUTED":
      case "CANCELLED":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getBankStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-blue-500 text-white">
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

  const handleConfirmDelivery = () => console.log("Confirming delivery...");
  const handleDispute = () => console.log("Opening dispute...");

  if (!isConnected)
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

  return (
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <h1 className="text-3xl font-bold">My Orders</h1>

        {loading && <p>Loading orders...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid md:grid-cols-3 gap-6">
          {orders.map((order) => {
            const Icon = getStatusIcon(order.status);
            return (
              <Card
                key={order.id}
                className={`cursor-pointer border ${
                  selectedId === order.id
                    ? "border-indigo-500"
                    : "border-gray-200"
                }`}
                onClick={() => {
                  setSelectedId(order.id);
                  fetchOrderDetail(order.id);
                }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className="w-6 h-6" />
                  <h3 className="font-semibold">{order.productName}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Producer: {order.producer}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: ${order.totalAmount.toFixed(2)}
                </p>
                <Progress value={order.progress} className="mt-2" />
                <div className="mt-2">
                  {getBankStatusBadge(order.buyerBank.status)}
                </div>
              </Card>
            );
          })}
        </div>

        {currentOrder && (
          <Card className="mt-6 p-6">
            <h2 className="text-xl font-bold mb-3">
              {currentOrder.productName}
            </h2>
            <p>Order ID: {currentOrder.orderId}</p>
            <p>Status: {currentOrder.status}</p>
            <Progress value={currentOrder.progress} className="my-3" />
            <div className="flex gap-3">
              {currentOrder.status === "IN_TRANSIT" && (
                <Button onClick={handleConfirmDelivery}>
                  Confirm Delivery
                </Button>
              )}
              {currentOrder.status === "DISPUTED" && (
                <Button variant="destructive" onClick={handleDispute}>
                  Open Dispute
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => fetchOrderDetail(currentOrder.id)}
              >
                Refresh
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

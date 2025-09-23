"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Truck, CheckCircle, Clock, Package, Shield, AlertCircle, FileCheck, Coins, TrendingUp, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import OrderFlowDetail from "./OrderFlowDetail";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/$/, "");


function money(n: number, w: number = 4) {
  const formatted = new Intl.NumberFormat(undefined, {
    style: "decimal",
    maximumFractionDigits: 8,
  }).format(n);

  return (
    <span className="flex items-center gap-1">
      <span style={{ fontWeight: "normal" }}>{formatted}</span>
      <span
        className={`inline-block w-${w} h-${w} bg-contain bg-no-repeat flex-shrink-0`}
        style={{ backgroundImage: `url(/assets/hbar_logo.png)` }}
      />
      <span style={{ fontWeight: "normal" }}>BAR</span>
    </span>
  );
}


// ---- BACKEND TYPES (STRICT) ----
export type BackendProduct = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  countryOfOrigin: string;
  category: string;
  subcategory: string;
  description: string;
  hsCode: string;
  incoterm: string;
  minOrderQty: number;
  leadTimeDays: number;
  images: Array<{ mime: string; path: string; size: number; filename: string; originalName: string }> | null;
  documents: any;
  createdAt: string;
  updatedAt: string;
};

export type BackendItem = {
  id: string;
  orderId: string;
  productId: number;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
  createdAt: string;
  updatedAt: string;
  product: BackendProduct;
};

export type BackendOrder = {
  id: string;
  code?: string; // NEW: human-friendly order code from backend
  userId: string;
  status:
    | "AWAITING_PAYMENT"
    | "PAID"
    | "READY_FOR_SHIPMENT"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "DISPUTED"
    | string;
  subtotal: string | number;
  shipping: string | number;
  total: string | number;
  createdAt: string;
  updatedAt: string;
  items: BackendItem[];
  documents: any[]; // Replace 'any' with a specific type if available
};

export type BackendOrderResponse = {
  success: boolean;
  orders?: BackendOrder[];
  order?: BackendOrder;
};

// ---- UI MODEL ----
export type BankStatus = "approved" | "verified" | "documents_submitted" | "pending_documents" | string;

export type OrderMilestone = {
  stage: string;
  completed: boolean;
  date: string | null;
  description?: string;
};

export type Order = {
  id: string;
  orderId: string; // still keep internal id for fetching details
  code?: string; // NEW: human-friendly code to display

  // preview (1er item) pour la liste
  productName: string;
  productUnit?: string;
  producer: string;
  quantity: number;
  unitPrice: number;

  // toutes les lignes de la commande
  items: BackendItem[];

  documents: any[]; // Replace 'any' with a specific type if available

  subtotal: number;
  shipping: number;
  totalAmount: number;
  total: string;

  escrowAmount: number;
  status: "bank_verification" | "ready_for_shipment" | "in_transit" | "delivered" | "disputed" | string;
  progress: number;
  orderDate: string;
  estimatedDelivery: string | null;
  trackingNumber: string | null;
  buyerAddress?: string;
  producerAddress?: string;
  escrowContract?: string;
  buyerBank: { status: BankStatus; documentsRequested: string[] };
  sellerBank: { status: BankStatus; documentsRequested: string[] };
  paymentSchedule: { onApproval: number; onShipment: number; onDelivery: number };
  milestones: OrderMilestone[];
};

const labelFor = (s: string) => {
  if (!s) return "";
  const clean = s.replace(/_/g, " ").toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

// ---- helpers ----
const toNumber = (n: any, d = 0) => {
  const v = typeof n === "string" ? Number.parseFloat(n) : Number(n);
  return Number.isFinite(v) ? v : d;
};

function useToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jwtToken");
}

// Map backend status -> UI status + progress
function mapStatus(s: string): { ui: Order["status"]; progress: number } {
  switch (s) {
    case "PENDING":
      return { ui: "pending", progress: 5 };
    case "AWAITING_PAYMENT":
      return { ui: "awaiting_payment", progress: 10 };
    case "PAID":
      return { ui: "paid", progress: 40 };
    case "FULFILLED":
      return { ui: "delivered", progress: 100 };
    case "PARTIALLY_FULFILLED":
      return { ui: "partially_fulfilled", progress: 80 };
    case "CANCELED":
      return { ui: "canceled", progress: 0 };
    case "REFUNDED":
      return { ui: "refunded", progress: 0 };
    case "READY_FOR_SHIPMENT":
      return { ui: "ready_for_shipment", progress: 60 };
    case "IN_TRANSIT":
      return { ui: "in_transit", progress: 80 };
    case "DELIVERED":
      return { ui: "delivered", progress: 100 };
    case "DISPUTED":
      return { ui: "disputed", progress: 20 };
    default:
      return { ui: s as Order["status"], progress: 20 };
  }
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

  // NEW: simple client-side pagination
  const [visibleCount, setVisibleCount] = useState<number>(10);

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

  const normalizeOrderFromBackend = useCallback(
    (b: BackendOrder): Order => {
      const firstItem = b.items?.[0];
      const { ui, progress } = mapStatus(b.status);

      const qty = toNumber(firstItem?.quantity, 0);
      const unitPrice = toNumber(firstItem?.unitPrice, 0);

      return {
        id: b.id,                 // keep true backend id
        orderId: b.id,            // keep for detail route param
        code: b.code ?? b.id,     // NEW: prefer code for display

        productName: firstItem?.product?.name ?? "Product",
        productUnit: firstItem?.product?.unit ?? undefined,
        producer: firstItem?.product?.countryOfOrigin ? `${firstItem.product.countryOfOrigin} Producer` : "Producer",
        quantity: qty,
        unitPrice,

        items: Array.isArray(b.items) ? b.items : [],
        documents: Array.isArray(b.documents) ? b.documents : [],

        subtotal: toNumber(b.subtotal, 0),
        shipping: toNumber(b.shipping, 0),
        totalAmount: toNumber(b.total, qty * unitPrice),
        total: typeof b.total === "string" ? b.total : String(b.total ?? qty * unitPrice),

        escrowAmount: toNumber(b.total, qty * unitPrice),
        status: ui,
        progress,
        orderDate: b.createdAt,
        estimatedDelivery: null,
        trackingNumber: null,
        buyerAddress: undefined,
        producerAddress: undefined,
        escrowContract: undefined,
        buyerBank: { status: "documents_submitted", documentsRequested: [] },
        sellerBank: { status: "documents_submitted", documentsRequested: [] },
        paymentSchedule: { onApproval: 0, onShipment: 50, onDelivery: 50 },
        milestones: normalizeMilestones([]),
      };
    },
    [normalizeMilestones]
  );

  const normalizeList = useCallback(
    (raw: BackendOrderResponse | BackendOrder[] | any): Order[] => {
      if (Array.isArray(raw)) return raw.map((o) => normalizeOrderFromBackend(o));
      if (Array.isArray(raw?.orders)) return raw.orders.map((o: BackendOrder) => normalizeOrderFromBackend(o));
      if (raw?.order) return [normalizeOrderFromBackend(raw.order)];
      return [];
    },
    [normalizeOrderFromBackend]
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
      setLastFetchedAt(Date.now());

      // NEW: reset the visible page to the first 10 whenever we refetch
      setVisibleCount(10);
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
          normalized.forEach((o) => map.set(o.id, o));
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
      case "awaiting_payment":
        return "bg-warning";
      case "paid":
      case "ready_for_shipment":
      case "in_transit":
        return "bg-info";
      case "delivered":
      case "fulfilled":
        return "bg-success";
      case "partially_fulfilled":
        return "bg-info";
      case "canceled":
      case "refunded":
      case "disputed":
        return "bg-destructive";
      case "pending":
        return "bg-muted";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "awaiting_payment":
      case "pending":
        return Shield;
      case "paid":
      case "ready_for_shipment":
        return Package;
      case "in_transit":
        return Truck;
      case "delivered":
      case "fulfilled":
        return CheckCircle;
      case "partially_fulfilled":
        return Clock;
      case "canceled":
      case "refunded":
      case "disputed":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  // Sort orders by newest first for "Recent Orders"
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const ta = new Date(a.orderDate || a.id).getTime();
      const tb = new Date(b.orderDate || b.id).getTime();
      return tb - ta;
    });
  }, [orders]);

  // Only show a slice based on visibleCount
  const visibleOrders = useMemo(
    () => sortedOrders.slice(0, visibleCount),
    [sortedOrders, visibleCount]
  );

  const canLoadMore = visibleCount < sortedOrders.length;

  const currentOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) || null,
    [orders, selectedId]
  );

  if (!isConnected) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Orders Access Required</h2>
            <p className="text-muted-foreground">Please connect your wallet to view your orders.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      {/* Stats Cards */}
      <div className="container mx-auto  grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 glass border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{orders?.length ?? 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success" />
          </div>
        </Card>

        <Card className="p-6 glass border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">
                {(orders ?? []).reduce((sum, o) => sum + (o.items?.length ?? 0), 0)}
              </p>
            </div>
            <Package className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6 glass border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">
                {money((orders ?? []).reduce((sum, o) => sum + (o.totalAmount ?? 0), 0), 6)}
              </p>
            </div>
            <Coins className="w-8 h-8 text-accent" />
          </div>
        </Card>

        <Card className="p-6 glass border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Orders Shipped</p>
              <p className="text-2xl font-bold">{(orders ?? []).filter(o => (o.status ?? "") === "delivered").length}</p>
            </div>
            <FileCheck className="w-8 h-8 text-warning" />
          </div>
        </Card>
      </div>

      <div className="container mx-auto px-6 py-8">

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <Card className="glass border-border/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>

                <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading orders…</p>
              ) : sortedOrders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {visibleOrders.map((order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    const extra = Math.max(0, (order.items?.length || 0) - 1);
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
                          {/* Display the new code instead of orderId */}
                          <span className="text-sm font-medium">{order.code}</span>
                          <StatusIcon className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {order.productName}
                          {extra > 0 ? ` + ${extra} more` : ""}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {labelFor(order.status)}
                          </Badge>
                        <span className="text-sm font-medium">{money(order.totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Load more control */}
                  {canLoadMore && (
                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setVisibleCount((c) => c + 10)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        load more
                      </Button>
                    </div>
                  )}

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
                <p className="text-muted-foreground text-sm">Select an order to view details.</p>
              </Card>
            ) : (
              <OrderFlowDetail order={currentOrder} loadingDetail={loadingDetail} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

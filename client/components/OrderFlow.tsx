"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Truck,
  CheckCircle,
  Clock,
  Package,
  Shield,
  AlertCircle,
  FileCheck,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import OrderFlowDetail from "./OrderFlowDetail";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000"
).replace(/\/$/, "");

// ---------------------- Utility Functions ----------------------
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

// ---------------------- Types ----------------------

// Backend types
export type BackendOrder = {
  id: string;
  code?: string;
  status:
    | "AWAITING_PAYMENT"
    | "BANK_REVIEW"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "DISPUTED"
    | "CANCELLED";
  subtotal: number | string;
  shipping: number | string;
  total: number | string;
  createdAt: string;
  updatedAt: string;
  items: any[];
  documents: any[];
};

export type BackendOrderResponse = {
  success: boolean;
  orders?: BackendOrder[];
  order?: BackendOrder;
};

// UI model
export type Order = {
  id: string;
  orderId: string;
  code?: string;
  productName: string;
  items: any[];
  documents: any[];
  subtotal: number;
  shipping: number;
  totalAmount: number;
  total: string;
  status:
    | "awaiting_payment"
    | "bank_review"
    | "in_transit"
    | "delivered"
    | "disputed"
    | "cancelled";
  progress: number;
  orderDate: string;
  estimatedDelivery: string | null;
  trackingNumber: string | null;
};

// ---------------------- Helpers ----------------------
function mapStatus(s: string): { ui: Order["status"]; progress: number } {
  switch (s) {
    case "AWAITING_PAYMENT":
      return { ui: "awaiting_payment", progress: 10 };
    case "BANK_REVIEW":
      return { ui: "bank_review", progress: 40 };
    case "IN_TRANSIT":
      return { ui: "in_transit", progress: 70 };
    case "DELIVERED":
      return { ui: "delivered", progress: 90 };
    case "DISPUTED":
      return { ui: "disputed", progress: 50 };
    case "CANCELLED":
      return { ui: "cancelled", progress: 0 };
    default:
      return { ui: "awaiting_payment", progress: 0 };
  }
}

const labelFor = (s: string) => {
  if (!s) return "";
  const clean = s.replace(/_/g, " ").toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const toNumber = (n: any, d = 0) => {
  const v = typeof n === "string" ? Number.parseFloat(n) : Number(n);
  return Number.isFinite(v) ? v : d;
};

function useToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jwtToken");
}

// ---------------------- Component ----------------------
export default function OrderFlow() {
  const { isConnected } = useAuth();
  const { triggerConnect } = useWalletConnect();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const token = useToken();

  // Normalize backend order to UI model
  const normalizeOrderFromBackend = useCallback((b: BackendOrder): Order => {
    const firstItem = b.items?.[0];
    const { ui, progress } = mapStatus(b.status);
    const qty = toNumber(firstItem?.quantity ?? 0);
    const unitPrice = toNumber(firstItem?.unitPrice ?? 0);

    return {
      id: b.id,
      orderId: b.id,
      code: b.code ?? b.id,
      productName: firstItem?.product?.name ?? "Product",
      items: Array.isArray(b.items) ? b.items : [],
      documents: Array.isArray(b.documents) ? b.documents : [],
      subtotal: toNumber(b.subtotal),
      shipping: toNumber(b.shipping),
      totalAmount: toNumber(b.total, qty * unitPrice),
      total: String(b.total ?? qty * unitPrice),
      status: ui,
      progress,
      orderDate: b.createdAt,
      estimatedDelivery: null,
      trackingNumber: null,
    };
  }, []);

  const normalizeList = useCallback(
    (raw: BackendOrderResponse | BackendOrder[] | any): Order[] => {
      if (Array.isArray(raw)) return raw.map(normalizeOrderFromBackend);
      if (Array.isArray(raw?.orders))
        return raw.orders.map(normalizeOrderFromBackend);
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

        const list = normalizeList(data);
        setOrders((prev) => {
          const map = new Map(prev.map((o) => [o.id, o]));
          list.forEach((o) => map.set(o.id, o));
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
      case "bank_review":
      case "in_transit":
        return "bg-info";
      case "delivered":
        return "bg-success";
      case "disputed":
      case "cancelled":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "awaiting_payment":
        return Shield;
      case "bank_review":
        return FileCheck;
      case "in_transit":
        return Truck;
      case "delivered":
        return CheckCircle;
      case "disputed":
      case "cancelled":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }, [orders]);

  const visibleOrders = useMemo(
    () => sortedOrders.slice(0, visibleCount),
    [sortedOrders, visibleCount]
  );

  const canLoadMore = visibleCount < sortedOrders.length;
  const currentOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) || null,
    [orders, selectedId]
  );

  // ---------------------- Render ----------------------
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
                <Button
                  variant="outline"
                  onClick={fetchOrders}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh
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
                          <span className="text-sm font-medium">
                            {order.code}
                          </span>
                          <StatusIcon className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {order.productName}
                          {extra > 0 ? ` + ${extra} more` : ""}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={getStatusColor(order.status)}
                          >
                            {labelFor(order.status)}
                          </Badge>
                          <span className="text-sm font-medium">
                            {money(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {canLoadMore && (
                    <div className="pt-2">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setVisibleCount((c) => c + 10)}
                      >
                        <Plus className="w-4 h-4 mr-2" /> load more
                      </Button>
                    </div>
                  )}

                  {lastFetchedAt && (
                    <div className="text-xs text-muted-foreground mt-2">
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
              <OrderFlowDetail
                order={currentOrder}
                loadingDetail={loadingDetail}
                onOrderUpdate={(updated) => {
                  setOrders((prev) =>
                    prev.map((o) =>
                      o.id === updated.id ? { ...o, ...updated } : o
                    )
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

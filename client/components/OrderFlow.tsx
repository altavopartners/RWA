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
  Coins,
  TrendingUp,
  Plus,
  TrashIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import OrderFlowDetail from "./BankOrderDetail";
import Footer from "@/components/Footer";

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
  producerWalletId: string;
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
  code?: string;
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
  documents: any[];
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
  orderId: string;
  code?: string;

  productName: string;
  productUnit?: string;
  producer: string;
  quantity: number;
  unitPrice: number;

  items: BackendItem[];
  documents: any[];

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

  // NEW: deletion modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

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
        id: b.id,
        orderId: b.id,
        code: b.code ?? b.id,

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

  useEffect(() => {
    const handler = () => fetchOrders();
    window.addEventListener("order:updated", handler);
    return () => window.removeEventListener("order:updated", handler);
  }, [fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_payment":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
      case "paid":
      case "ready_for_shipment":
      case "in_transit":
        return "bg-[#88CEDC]/20 text-[#5BA8B8] border-[#88CEDC]/30";
      case "delivered":
      case "fulfilled":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
      case "partially_fulfilled":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "canceled":
      case "refunded":
      case "disputed":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30";
      case "pending":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30";
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
  const visibleOrders = useMemo(() => sortedOrders.slice(0, visibleCount), [sortedOrders, visibleCount]);

  const canLoadMore = visibleCount < sortedOrders.length;

  const currentOrder = useMemo(() => orders.find((o) => o.id === selectedId) || null, [orders, selectedId]);

  if (!isConnected) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0C171B] dark:via-[#1a2930] dark:to-[#0C171B]">
        <div className="container mx-auto px-6 py-8">
          <Card className="p-8 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <Shield className="w-16 h-16 mx-auto mb-4 text-[#88CEDC]" />
            <h2 className="text-2xl font-bold mb-2">Orders Access Required</h2>
            <p className="text-muted-foreground mb-6">Please connect your wallet to view your orders.</p>
            <Button 
              onClick={triggerConnect}
              className="bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white"
            >
              Connect Wallet
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const handleDeleteOrder = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/orders/delete-my-order/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      if (res.ok) {
        setSelectedId((prev) => (prev === id ? null : prev));
        fetchOrders();
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0C171B] dark:via-[#1a2930] dark:to-[#0C171B]">
      {/* Header */}
      <div className="container mx-auto px-6 pt-8 pb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
          My Orders
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Track and manage all your export orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{orders?.length ?? 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(orders ?? []).reduce((sum, o) => sum + (o.items?.length ?? 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {money((orders ?? []).reduce((sum, o) => sum + (o.totalAmount ?? 0), 0), 5)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Orders Shipped</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(orders ?? []).filter((o) => (o.status ?? "") === "delivered").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      <div className="container mx-auto px-6 pb-12">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchOrders} 
                  disabled={loading}
                  className="border-[#88CEDC] text-[#88CEDC] hover:bg-[#88CEDC] hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : sortedOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">No orders yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleOrders.map((order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    const extra = Math.max(0, (order.items?.length || 0) - 1);
                    const canDelete = order.status === "awaiting_payment";
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedId(order.id);
                          fetchOrderDetail(order.id);
                        }}
                        className={`p-4 rounded-lg cursor-pointer transition-all border ${
                          selectedId === order.id
                            ? "border-[#88CEDC] bg-[#88CEDC]/10 shadow-md"
                            : "border-gray-200 dark:border-gray-700 hover:border-[#88CEDC]/50 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{order.code}</span>

                          {canDelete && (
                            <AlertDialog open={deleteOpen && deleteId === order.id} onOpenChange={setDeleteOpen}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(order.id);
                                    setDeleteOpen(true);
                                  }}
                                  aria-label={`Delete order ${order.code}`}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove order <span className="font-medium">{order.code}</span>.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={() => {
                                      setDeleteOpen(false);
                                      setDeleteId(null);
                                    }}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={async () => {
                                      if (deleteId) {
                                        await handleDeleteOrder(deleteId);
                                      }
                                    }}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
                          {order.productName}
                          {extra > 0 ? ` + ${extra} more` : ""}
                        </p>

                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={`${getStatusColor(order.status)} border`}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1" />
                            {labelFor(order.status)}
                          </Badge>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{money(order.totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {canLoadMore && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800" 
                        onClick={() => setVisibleCount((c) => c + 10)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Load more
                      </Button>
                    </div>
                  )}

                  {lastFetchedAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 pt-2">
                      Last updated: {new Date(lastFetchedAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-3">
            {!currentOrder ? (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">Select an order to view details.</p>
              </Card>
            ) : (
              <OrderFlowDetail order={currentOrder} loadingDetail={loadingDetail} />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
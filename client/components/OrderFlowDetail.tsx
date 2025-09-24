"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Truck, CheckCircle, Clock, Package, Shield, AlertCircle, Image as ImageIcon, Lock, HandCoins } from "lucide-react";
import type { Order } from "./OrderFlow";
import DocumentCenter, { DocumentItem } from "./DocumentCenter";

// ===== API base (local copy) =====
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/$/, "");

// ===== MetaMask / Hedera helpers (local to OrderDetailsFlow) =====
type Eip1193Provider = {
  request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
};
declare global {
  interface Window {
    ethereum?: any;
  }
}

const HEDERA_TESTNET = {
  chainId: "0x128", // 296 decimal
  chainName: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

async function ensureHederaTestnet(provider: Eip1193Provider) {
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: HEDERA_TESTNET.chainId }] });
  } catch (err: any) {
    if (err?.code === 4902) {
      await provider.request({ method: "wallet_addEthereumChain", params: [HEDERA_TESTNET] });
    } else {
      throw err;
    }
  }
}

function toWeiHex(amountHBAR: string | number): string {
  const s = String(amountHBAR);
  const [intPart, frac = ""] = s.split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  const weiStr = (
    BigInt(intPart || "0") * BigInt(Math.pow(10, 18)) +
    BigInt(fracPadded || "0")
  ).toString(16);
  return "0x" + weiStr;
}

// ===== Money UI (HBAR) =====
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
      <span style={{ fontWeight: "normal", color: "black" }}>BAR</span>
    </span>
  );
}

// ===== Helpers (local) =====
const toNumber = (n: any, d = 0) => {
  const v = typeof n === "string" ? Number.parseFloat(n) : Number(n);
  return Number.isFinite(v) ? v : d;
};

const pickFirstImageUrl = (images: any): string | null => {
  if (!images) return null;
  if (Array.isArray(images) && images.length && images[0]?.path) return `${API_BASE}${images[0].path}`;
  if (typeof images === "string") return images;
  if (Array.isArray(images) && typeof images[0] === "string") return images[0];
  if (typeof images === "object" && (images as any).path) return `${API_BASE}${(images as any).path}`;
  return null;
};

type Props = {
  order: Order;
  loadingDetail?: boolean;
  onConfirmDelivery?: () => void;
  onDispute?: () => void;
  documents?: DocumentItem[];
  onUploadDoc?: (file: File, meta: { categoryKey: string; typeKey: string; orderId: string }) => Promise<DocumentItem>;
  onDeleteDoc?: (doc: DocumentItem) => Promise<void>;
};

export default function OrderDetailsFlow({
  order,
  loadingDetail,
  onConfirmDelivery,
  onDispute,
  onUploadDoc,
  onDeleteDoc,
}: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "bank_verification":
        return "bg-yellow-500";
      case "ready_for_shipment":
      case "in_transit":
        return "bg-sky-500";
      case "delivered":
        return "bg-green-600";
      case "disputed":
        return "bg-red-600";
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
    const clean = s.replace(/_/g, " ").toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const StatusIcon = getStatusIcon((order as any).status);
  const itemsCount = order.items?.length || 0;

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handlePay() {
  setPayError(null);
  setTxHash(null);
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not detected. Please install or enable it.");
    }
    const provider = window.ethereum as Eip1193Provider;
    await ensureHederaTestnet(provider);
    const [from] = await provider.request({ method: "eth_requestAccounts" });

    const to = "0x96e51caadac0f4ccc74a204fd6e07dade6b32710";
    if (!to || !to.startsWith("0x") || to.length !== 42) {
      throw new Error("Invalid escrow contract address.");
    }

    const amountHBAR = String((order as any).totalAmount ?? "0");
    const value = toWeiHex(amountHBAR);

    setPaying(true);
    const txHashLocal: string = await provider.request({
      method: "eth_sendTransaction",
      params: [{ from, to, value }],
    });
    setTxHash(txHashLocal);

    // === NEW: mark the order as PAID on your backend
    const orderId = (order as any).id ?? (order as any)._id ?? (order as any).orderId;
    await updateOrderStatusToPaid(orderId);

    // Optional: optimistic UI tweak if you want to reflect it immediately
    // (order as any).status = "PAID"; // only if you're okay mutating the prop
  } catch (e: any) {
    setPayError(e?.message || "Payment failed.");
  } finally {
    setPaying(false);
  }
}



  // ===== Update order status helper =====
async function updateOrderStatusToPaid(orderId: string) {
  if (!orderId) throw new Error("Missing order id");

  const url = `${API_BASE}/api/orders/update-my-order-status/${encodeURIComponent(orderId)}`;

  const token =
      typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null

  const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Try 1: GET with body (some servers accept it, many proxies don’t)
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "PAID" }),
        credentials: "include",
      });
      if (res.ok) {
        dispatchEvent(new Event("order:updated"));
      } else {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Failed to update order status. (${res.status})`);
      }
    } catch {
    }
  }


  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Upload center */}
      <div className="xl:col-span-3">
        <DocumentCenter order={order} documents={order.documents} onUploadDoc={onUploadDoc} onDeleteDoc={onDeleteDoc} />
      </div>

      {/* Main Order Info */}
      <div className="xl:col-span-2 space-y-6">
        <Card className="glass border-border/50 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{(order as any).code}</h2>
              <p className="text-sm text-muted-foreground">
                {itemsCount} item{itemsCount > 1 ? "s" : ""} in this order
              </p>
            </div>
            <Badge variant="outline" className={`${getStatusColor((order as any).status)}`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {labelFor((order as any).status)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-semibold">{money((order as any).subtotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shipping</p>
              <p className="font-semibold">{money((order as any).shipping)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold ">{money((order as any).totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="font-semibold">
                {(order as any).progress}%
                {(loadingDetail as any) && <span className="text-xs text-muted-foreground ml-2">(updating…)</span>}
              </p>
            </div>
          </div>

          <Progress value={(order as any).progress} className="mb-4" />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Ordered: {(order as any).orderDate ? new Date((order as any).orderDate).toLocaleString() : "—"}</span>
            <span>Est. Delivery: {(order as any).estimatedDelivery ?? "—"}</span>
          </div>
        </Card>

        <Card className="glass border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          <div className="divide-y">
            {(order.items || []).map((it: any) => {
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
                      Qty: <span className="font-medium">{qty}{unit}</span> · Unit: <span className="font-medium">{money(unitPrice)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Line Total</p>
                    <p className="font-semibold">{money(lineTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{money((order as any).subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">{money((order as any).shipping)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{money((order as any).totalAmount)}</span>
            </div>
          </div>

          <style jsx global>{`
            @keyframes blink {
              0% { opacity: 1; }
              50% { opacity: 0.4; }
              100% { opacity: 1; }
            }
            .blink {
              animation: blink 1s infinite;
            }
          `}</style>
          {order.status === "awaiting_payment" && (
            <div className="text-center space-y-2">
              <Button
                variant="default"
                disabled={paying}
                className={`cursor-pointer bg-green-600/60 text-lg rounded-xl ${paying ? "blink" : ""}`}
                onClick={handlePay}
              >
                <HandCoins className="w-6 h-6 mr-3" />
                {paying ? "Processing..." : "Proceed to Pay"}
              </Button>
              {payError && <p className="text-xs text-destructive">{payError}</p>}
            </div>
            )}
              {txHash && (
                <p className="text-sm">
                  Payment sent:{" "}
                  <a className="underline" href={`https://hashscan.io/testnet/tx/${txHash}`} target="_blank" rel="noreferrer">
                    View on HashScan
                  </a>
                </p>
              )}
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="glass border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Hedera Escrow Details
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Escrow Amount</p>
              <p className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">{money((order as any).totalAmount, 6)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Payment Schedule</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>On Bank Approval:</span>
                  <span className="font-medium">{(order as any).paymentSchedule.onApproval}%</span>
                </div>
                <div className="flex justify-between">
                  <span>On Shipment:</span>
                  <span className="font-medium text-yellow-500">{(order as any).paymentSchedule.onShipment}%</span>
                </div>
                <div className="flex justify-between">
                  <span>On Delivery:</span>
                  <span className="font-medium text-green-600">{(order as any).paymentSchedule.onDelivery}%</span>
                </div>
              </div>
            </div>

            {(order as any).escrowContract && (
              <div>
                <p className="text-sm text-muted-foreground">Hedera Contract</p>
                <p className="font-mono text-sm break-all">{(order as any).escrowContract}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Escrow Status</p>
              <div className="flex items-center gap-2">
                {false ? (
                  <>
                    <Lock className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Funds Secured & Active</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-500">Pending Bank Approval</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

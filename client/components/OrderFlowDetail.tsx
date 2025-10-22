"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Truck,
  CheckCircle,
  Clock,
  Shield,
  AlertCircle,
  Lock,
  HandCoins,
} from "lucide-react";
import type { Order } from "./OrderFlow";
import DocumentCenter, { DocumentItem } from "./DocumentCenter";
import { useAuth } from "@/hooks/useAuth"; // ✅ import auth hook

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
    /\/$/,
    ""
  ) + "/api";

type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: any[] | Record<string, any>;
  }) => Promise<any>;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

const HEDERA_TESTNET = {
  chainId: "0x128",
  chainName: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

async function ensureHederaTestnet(provider: Eip1193Provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HEDERA_TESTNET.chainId }],
    });
  } catch (err: any) {
    if (err?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [HEDERA_TESTNET],
      });
    } else throw err;
  }
}

function toWeiHex(amountHBAR: string | number): string {
  const s = String(amountHBAR ?? 0).trim();
  if (!s || s === "NaN") return "0x0";
  const [intPartRaw, fracRaw = ""] = s.split(".");
  const intPart = intPartRaw.replace(/[^0-9]/g, "") || "0";
  const frac = fracRaw.replace(/[^0-9]/g, "");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  const WEI_PER_HBAR = BigInt("1000000000000000000");
  const wei = BigInt(intPart) * WEI_PER_HBAR + BigInt(fracPadded || "0");
  return "0x" + wei.toString(16);
}

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

type Props = {
  order: Order;
  loadingDetail?: boolean;
  documents?: DocumentItem[];
  onUploadDoc?: (
    file: File,
    meta: { categoryKey: string; typeKey: string; orderId: string }
  ) => Promise<DocumentItem>;
  onDeleteDoc?: (doc: DocumentItem) => Promise<void>;
  onOrderUpdate?: (order: Order) => void; // ✅ add this
};

export default function OrderFlowDetail({
  order,
  onUploadDoc,
  onDeleteDoc,
  onOrderUpdate,
}: Props) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { token: contextToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  // Sync token from context or localStorage
  useEffect(() => {
    if (contextToken) setToken(contextToken);
    else {
      const t = localStorage.getItem("jwtToken");
      if (t) setToken(t);
    }
  }, [contextToken]);

  // ✅ Reset payment state when order changes
  useEffect(() => {
    setPaying(false);
    setTxHash(null);
    setPayError(null);
    setCurrentStatus(order.status);
  }, [order.id, order.status]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "AWAITING_PAYMENT":
        return "bg-gray-400";
      case "BANK_REVIEW":
        return "bg-yellow-500";
      case "IN_TRANSIT":
        return "bg-sky-500";
      case "DELIVERED":
        return "bg-green-600";
      case "DISPUTED":
        return "bg-red-600";
      case "CANCELLED":
        return "bg-gray-700";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "AWAITING_PAYMENT":
        return HandCoins;
      case "BANK_REVIEW":
        return Shield;
      case "IN_TRANSIT":
        return Truck;
      case "DELIVERED":
        return CheckCircle;
      case "DISPUTED":
        return AlertCircle;
      case "CANCELLED":
        return Clock;
      default:
        return Clock;
    }
  };

  const labelFor = (s: string) => {
    if (!s) return "";
    const clean = s.replace(/_/g, " ").toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const getProgressValue = (status: string) => {
    switch (status.toUpperCase()) {
      case "AWAITING_PAYMENT":
        return 0;
      case "BANK_REVIEW":
        return 25;
      case "IN_TRANSIT":
        return 65;
      case "DELIVERED":
        return 100;
      case "DISPUTED":
        return 50;
      case "CANCELLED":
        return 0;
      default:
        return 0;
    }
  };

  const getEscrowStatus = (status: string) => {
    const upper = status.toUpperCase();
    if (upper === "BANK_REVIEW")
      return {
        text: "Pending Bank Approval",
        color: "text-yellow-500",
        icon: Clock,
      };
    if (["IN_TRANSIT", "DELIVERED"].includes(upper))
      return {
        text: "Funds Secured & Active",
        color: "text-green-600",
        icon: Lock,
      };
    return { text: "Pending Payment", color: "text-gray-400", icon: HandCoins };
  };

  const handlePay = async () => {
    setPayError(null);
    setTxHash(null);

    console.log("handlePay called for order:", order.id);

    try {
      if (!window.ethereum) throw new Error("MetaMask not detected.");
      if (!token) throw new Error("User not authenticated"); // ✅ check here

      const provider = window.ethereum as Eip1193Provider;
      await ensureHederaTestnet(provider);

      const [from] = await provider.request({ method: "eth_requestAccounts" });
      const contractAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT;
      if (!contractAddress) throw new Error("Escrow contract not defined.");

      const value = toWeiHex(order.totalAmount ?? 0);
      setPaying(true);

      const txHashLocal: string = await provider.request({
        method: "eth_sendTransaction",
        params: [{ from, to: contractAddress, value }],
      });
      setTxHash(txHashLocal);

      // ✅ Update backend DB status with JWT
      const url = `${API_BASE}/orders/${order.id}/status`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "BANK_REVIEW" }),
      });

      console.log("Response status:", res.status);
      const updatedOrder = await res.json();
      console.log("Updated order response:", updatedOrder);

      if (!res.ok)
        throw new Error(
          updatedOrder?.message || "Failed to update order status."
        );

      setCurrentStatus(updatedOrder.order.status);

      // ✅ tell parent about the update
      onOrderUpdate?.(updatedOrder.order);
    } catch (e: any) {
      console.error("Payment error:", e);
      setPayError(e?.message || "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  const StatusIcon = getStatusIcon(currentStatus);
  const itemsCount = order.items?.length || 0;
  const paymentSchedule = (order as any).paymentSchedule || {
    onApproval: 0,
    onShipment: 0,
    onDelivery: 0,
  };
  const escrow = getEscrowStatus(currentStatus);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-3">
        <DocumentCenter
          order={order}
          documents={order.documents}
          onUploadDoc={onUploadDoc}
          onDeleteDoc={onDeleteDoc}
        />
      </div>

      <div className="xl:col-span-2 space-y-6">
        <Card className="glass border-border/50 p-6 transition-all duration-500">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{order.code}</h2>
              <p className="text-sm text-muted-foreground">
                {itemsCount} item{itemsCount > 1 ? "s" : ""}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`${getStatusColor(
                currentStatus
              )} transition-colors duration-500`}
            >
              <StatusIcon className="w-4 h-4 mr-2" />
              {labelFor(currentStatus)}
            </Badge>
          </div>

          <Progress
            value={getProgressValue(currentStatus)}
            className="mb-4 transition-all duration-500"
          />

          <div className="text-center space-y-2">
            <Button
              variant="default"
              disabled={
                paying || currentStatus.toUpperCase() !== "AWAITING_PAYMENT"
              }
              className={`cursor-pointer bg-green-600/60 text-lg rounded-xl ${
                paying ? "blink" : ""
              }`}
              onClick={handlePay}
            >
              <HandCoins className="w-6 h-6 mr-3" />
              {paying
                ? "Processing..."
                : currentStatus.toUpperCase() === "AWAITING_PAYMENT"
                ? "Proceed to Pay"
                : "Payment Done"}
            </Button>

            {txHash && (
              <p className="text-sm">
                Payment sent:{" "}
                <a
                  className="underline"
                  href={`https://hashscan.io/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on HashScan
                </a>
              </p>
            )}
            {payError && <p className="text-xs text-destructive">{payError}</p>}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="glass border-border/50 p-6 transition-all duration-500">
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
                {money(order.totalAmount, 6)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Payment Schedule
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>On Bank Approval:</span>
                  <span className="font-medium">
                    {paymentSchedule.onApproval}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>On Shipment:</span>
                  <span className="font-medium text-yellow-500">
                    {paymentSchedule.onShipment}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>On Delivery:</span>
                  <span className="font-medium text-green-600">
                    {paymentSchedule.onDelivery}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Escrow Status</p>
              <div className="flex items-center gap-2">
                <escrow.icon className={`w-4 h-4 ${escrow.color}`} />
                <span className={`text-sm ${escrow.color}`}>{escrow.text}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

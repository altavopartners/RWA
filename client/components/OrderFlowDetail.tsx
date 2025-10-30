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
  FileCheck,
} from "lucide-react";
import type { Order } from "./OrderFlow";
import DocumentCenter, { DocumentItem } from "./DocumentCenter";
import { useAuth } from "@/hooks/useAuth";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
    /\/$/,
    ""
  ) + "/api";

type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
};

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
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 4902) {
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
      <span style={{ fontWeight: "normal" }}>BAR</span>
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
  onOrderUpdate?: (order: Order) => void;
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

  useEffect(() => {
    if (contextToken) setToken(contextToken);
    else {
      const t = localStorage.getItem("jwtToken");
      if (t) setToken(t);
    }
  }, [contextToken]);

  useEffect(() => {
    setPaying(false);
    setTxHash(null);
    setPayError(null);
    setCurrentStatus(order.status);
  }, [order.id, order.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_payment":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
      case "bank_review":
      case "in_transit":
        return "bg-[#88CEDC]/20 text-[#5BA8B8] border-[#88CEDC]/30";
      case "delivered":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
      case "disputed":
      case "cancelled":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30";
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

  const labelFor = (s: string) => {
    if (!s) return "";
    const clean = s.replace(/_/g, " ").toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case "awaiting_payment":
        return 10;
      case "bank_review":
        return 40;
      case "in_transit":
        return 70;
      case "delivered":
        return 100;
      case "disputed":
        return 50;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  const getEscrowStatus = (status: string) => {
    if (status === "bank_review")
      return {
        text: "Pending Bank Approval",
        color: "text-yellow-600 dark:text-yellow-400",
        icon: Clock,
      };
    if (["in_transit", "delivered"].includes(status))
      return {
        text: "Funds Secured & Active",
        color: "text-green-600 dark:text-green-400",
        icon: Lock,
      };
    return {
      text: "Pending Payment",
      color: "text-gray-600 dark:text-gray-400",
      icon: HandCoins,
    };
  };

  const handlePay = async () => {
    setPayError(null);
    setTxHash(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum;
      if (!eth) throw new Error("MetaMask not detected.");
      if (!token) throw new Error("User not authenticated");

      const contractAddress = order.escrowAddress;
      if (!contractAddress) {
        throw new Error(
          "Escrow contract not deployed for this order yet. The system is being configured for payments. Please contact support."
        );
      }

      const provider = eth as Eip1193Provider;
      await ensureHederaTestnet(provider);

      const accountsResult = await provider.request({
        method: "eth_requestAccounts",
      });
      if (!Array.isArray(accountsResult) || accountsResult.length === 0) {
        throw new Error("No accounts found in MetaMask");
      }
      const from = String(accountsResult[0] || "");
      if (!from) throw new Error("Invalid account address");

      const value = toWeiHex(order.totalAmount ?? 0);
      setPaying(true);

      const txHashResult = await provider.request({
        method: "eth_sendTransaction",
        params: [{ from, to: contractAddress, value }],
      });
      const txHashLocal = String(txHashResult || "");
      if (!txHashLocal)
        throw new Error("Transaction failed - no hash returned");
      setTxHash(txHashLocal);

      const url = `${API_BASE}/orders/${order.id}/status`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "BANK_REVIEW" }),
      });

      const updatedOrder = await res.json();

      if (!res.ok)
        throw new Error(
          updatedOrder?.message || "Failed to update order status."
        );

      setCurrentStatus(updatedOrder.order.status);
      onOrderUpdate?.(updatedOrder.order);
    } catch (e: unknown) {
      console.error("Payment error:", e);
      setPayError(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  const StatusIcon = getStatusIcon(currentStatus);
  const itemsCount = order.items?.length || 0;
  const paymentSchedule = {
    onApproval: 0,
    onShipment: 50,
    onDelivery: 50,
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
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {order.code}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {itemsCount} item{itemsCount > 1 ? "s" : ""}
              </p>
            </div>
            <Badge variant="outline" className={`${getStatusColor(currentStatus)} border`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {labelFor(currentStatus)}
            </Badge>
          </div>

          <Progress
            value={getProgressValue(currentStatus)}
            className="mb-6 h-2"
          />

          <div className="text-center space-y-4">
            <Button
              variant="default"
              disabled={paying || currentStatus !== "awaiting_payment"}
              className={`w-full bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white text-lg py-6 rounded-xl ${
                paying ? "animate-pulse" : ""
              }`}
              onClick={handlePay}
            >
              <HandCoins className="w-6 h-6 mr-3" />
              {paying
                ? "Processing..."
                : currentStatus === "awaiting_payment"
                ? "Proceed to Pay"
                : "Payment Done"}
            </Button>

            {txHash && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Payment sent:{" "}
                <a
                  className="text-[#88CEDC] hover:text-[#5BA8B8] underline"
                  href={`https://hashscan.io/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on HashScan
                </a>
              </p>
            )}
            {payError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {payError}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-[#88CEDC]" />
            Hedera Escrow Details
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Escrow Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {money(order.totalAmount, 6)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Payment Schedule
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">On Bank Approval:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {paymentSchedule.onApproval}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">On Shipment:</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {paymentSchedule.onShipment}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">On Delivery:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {paymentSchedule.onDelivery}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Escrow Status</p>
              <div className="flex items-center gap-2">
                <escrow.icon className={`w-4 h-4 ${escrow.color}`} />
                <span className={`text-sm font-medium ${escrow.color}`}>
                  {escrow.text}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
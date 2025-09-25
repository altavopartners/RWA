// ===========================================
// src/components/orders/PaymentSection.tsx
// Hedera SplitPay UI — Full-debug + uint256 checks
// ===========================================
"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HandCoins } from "lucide-react";
import { getSplitPayContract } from "@/lib/contract";

// ---- EIP-1193 typing ----
export type Eip1193Provider = {
  request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
};

// ---- Hedera Testnet config ----
export const HEDERA_TESTNET = {
  chainId: "0x128", // 296 decimal
  chainName: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

// ---- Tunables ----
const CALL_GAS_LIMIT = BigInt(550_000);
const SEND_GAS_LIMIT = BigInt(1_200_000);

// ---- uint256 sanity check ----
const MAX_UINT256 = (1n << 256n) - 1n;
function assertUint256(value: bigint, label: string = "value"): void {
  if (value < 0n) throw new Error(`${label} must not be negative. Got: ${value.toString()}`);
  if (value > MAX_UINT256) throw new Error(`${label} exceeds uint256 max (2^256-1). Got: ${value.toString()}`);
}

// ---- Ensure wallet is on Hedera Testnet ----
export async function ensureHederaTestnet(provider: Eip1193Provider) {
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

// ---- API base ----
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/$/, "");

// ---- Update order status to PAID ----
export async function updateOrderStatusToPaid(orderId: string) {
  if (!orderId) throw new Error("Missing order id");
  const url = `${API_BASE}/api/orders/update-my-order-status/${encodeURIComponent(orderId)}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "PAID" }),
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Failed to update order status. (${res.status})`);
  }

  dispatchEvent(new Event("order:updated"));
}

// ---- Helpers ----
function extractRevertHex(err: any): string | null {
  const isHex = (v: any) => typeof v === "string" && v.startsWith("0x") && v.length >= 10;
  return (
    (isHex(err?.data) && err.data) ||
    (isHex(err?.error?.data) && err.error.data) ||
    (() => {
      try {
        const b = typeof err?.body === "string" ? JSON.parse(err.body) : null;
        return (isHex(b?.error?.data) && b.error.data) || (isHex(b?.data) && b.data) || null;
      } catch {
        return null;
      }
    })() ||
    null
  );
}

type PayoutIn = { wallet: string; amountHBAR: number | string };

function sortParallel(addresses: string[], amounts: bigint[]) {
  const rows = addresses.map((addr, i) => ({ addr: addr.toLowerCase(), orig: addr, amt: amounts[i] }));
  rows.sort((a, b) => (a.addr < b.addr ? -1 : a.addr > b.addr ? 1 : 0));
  return { recipients: rows.map(r => r.orig), amountsWei: rows.map(r => r.amt) };
}

// Deterministic HBAR string -> BigInt wei parser
function parseHBARToWei(input: string): bigint {
  const raw = String(input ?? "").trim();
  if (!raw.length) throw new Error("Empty amount string");
  const normalized = raw.replace(",", ".").replace(/\s+/g, "");
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error(`Invalid HBAR amount string: "${input}"`);
  const [intPartRaw, fracPartRaw = ""] = normalized.split(".");
  const intPart = intPartRaw.replace(/^0+(?!$)/, "") || "0";
  const fracPadded = (fracPartRaw + "0".repeat(18)).slice(0, 18);
  const wei = BigInt(intPart + fracPadded);
  assertUint256(wei, `parsed amount for ${input}`);
  return wei;
}

function formatWeiToHBAR(wei: bigint): string {
  const W = 10n ** 18n;
  const integer = wei / W;
  const remainder = wei % W;
  let frac = remainder.toString().padStart(18, "0").replace(/0+$/, "");
  return frac === "" ? `${integer}` : `${integer}.${frac}`;
}

// Normalize payouts
async function normalizePayouts(source: PayoutIn[], sender?: string) {
  console.log("normalizePayouts() input:", source);
  const map = new Map<string, bigint>();

  for (const p of source) {
    const wallet = String(p.wallet || "").trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      console.warn("Skipping invalid wallet:", wallet);
      continue;
    }

    const amtStr = String(p.amountHBAR ?? "").trim();
    if (!amtStr) continue;

    let wei: bigint;
    try { wei = parseHBARToWei(amtStr); } 
    catch (e: any) { console.warn(e); continue; }

    console.log(`Parsed ${amtStr} HBAR -> ${wei.toString()} wei`);
    const prev = map.get(wallet) ?? 0n;
    map.set(wallet, prev + wei);
  }

  const rec: string[] = [];
  const amts: bigint[] = [];
  for (const [wallet, wei] of map.entries()) { rec.push(wallet); amts.push(wei); }

  const { recipients, amountsWei } = sortParallel(rec, amts);
  const totalWei = amountsWei.reduce((a, b) => a + b, 0n);
  assertUint256(totalWei, "totalWei");

  console.log("Recipients:", recipients);
  console.log("Amounts (wei):", amountsWei.map(a => a.toString()));
  console.log("Total wei:", totalWei.toString(), "=> HBAR:", formatWeiToHBAR(totalWei));

  return { recipients, amountsWei, totalWei };
}

// Build payouts from order
export function buildPayoutsFromOrder(order: any) {
  const payouts: Array<{ wallet: string; amountHBAR: string }> = [];
  for (const item of order?.items ?? []) {
    const product = item?.product;
    const wallet = String(product?.producerWalletId || "").trim();
    const hbar = item?.lineTotal != null ? String(item.lineTotal) : "";
    payouts.push({ wallet, amountHBAR: hbar });
  }
  console.log("buildPayoutsFromOrder ->", payouts);
  return payouts;
}

// Execute splitExact
export async function executeSplitPayment(payouts: PayoutIn[]): Promise<string> {
  console.log("=== executeSplitPayment START ===");
  if (!payouts.length) throw new Error("No valid providers for this order.");
  if (typeof window === "undefined" || !(window as any).ethereum)
    throw new Error("MetaMask not detected.");

  const eip = (window as any).ethereum as Eip1193Provider;
  await ensureHederaTestnet(eip);

  const contract = await getSplitPayContract();
  const runner: any = contract?.runner;
  const provider: any = runner?.provider ?? runner;
  const from: string | undefined = await runner?.getAddress?.();

  const { recipients, amountsWei, totalWei } = await normalizePayouts(payouts, from);

  // Construct overrides
  const overrides = { value: totalWei, gasLimit: SEND_GAS_LIMIT };
  console.log("TX overrides:", { valueWei: overrides.value.toString(), gasLimit: overrides.gasLimit.toString() });

  let tx: any;
  try {
    tx = await contract["splitExact(address[],uint256[])"](recipients, amountsWei, overrides);
  } catch (err: any) {
    console.error("Transaction send error:", err);
    const hex = extractRevertHex(err);
    if (hex) console.error("Revert hex:", hex);
    throw err;
  }

  const rcpt = await tx.wait();
  console.log("Transaction receipt:", rcpt);
  if (rcpt.status === 0) throw new Error("Transaction failed on-chain.");

  console.log("=== executeSplitPayment SUCCESS ===", rcpt.hash);
  return rcpt.hash;
}

// Local hook
function useSplitPay(order: any) {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const payouts = buildPayoutsFromOrder(order);
        const { recipients, amountsWei, totalWei } = await normalizePayouts(payouts);
        if (!alive) return;
        setPreview({ ok: true, recipients, amountsWei: amountsWei.map(x => x.toString()), totalWei: totalWei.toString() });
      } catch (e: any) { if (!alive) return; setPreview({ ok: false, error: e.message }); }
    })();
    return () => { alive = false; };
  }, [order]);

  const handlePay = useCallback(async () => {
    setPayError(null); setTxHash(null); setPaying(true);
    try {
      const payouts = buildPayoutsFromOrder(order);
      const hash = await executeSplitPayment(payouts);
      setTxHash(hash);

      const orderId = order?.id ?? order?._id ?? order?.orderId;
      if (orderId) await updateOrderStatusToPaid(orderId);
    } catch (e: any) {
      console.error("handlePay error:", e);
      setPayError(e.message || "Payment failed.");
    } finally { setPaying(false); }
  }, [order]);

  return { paying, payError, txHash, handlePay, preview };
}

// PaymentSection UI
export default function PaymentSection({ order }: { order: any }) {
  const { paying, payError, txHash, handlePay, preview } = useSplitPay(order);

  return (
    <>
      {order?.status === "awaiting_payment" && (
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
          {payError && <pre className="text-xs text-destructive text-left whitespace-pre-wrap break-words mt-2">{payError}</pre>}
          {process.env.NODE_ENV !== "production" && preview && (
            <details className="text-left mx-auto mt-2 max-w-xl">
              <summary className="cursor-pointer text-sm underline">Debug preview</summary>
              <pre className="text-xs whitespace-pre-wrap break-words">
                {preview.ok ? JSON.stringify(preview, null, 2) : `Error: ${preview.error}`}
              </pre>
            </details>
          )}
        </div>
      )}
      {txHash && (
        <p className="text-sm mt-2">
          Payment sent: <a className="underline" href={`https://hashscan.io/testnet/tx/${txHash}`} target="_blank" rel="noreferrer">View on HashScan</a>
        </p>
      )}

      <style jsx global>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        .blink { animation: blink 1s infinite; }
      `}</style>
    </>
  );
}

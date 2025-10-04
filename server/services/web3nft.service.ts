// services/productNft.service.ts
import {
  Hbar,
  PrivateKey,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenSupplyType,
  TokenType,
  TokenUpdateTransaction,
  AccountId,
  Client,
} from "@hashgraph/sdk";
import { getHederaClient } from "../config/hedera";

/* ----------------------------- Types & consts ----------------------------- */

export type NFTDataInput = {
  /** Collection/line name, e.g., "test32" */
  name: string;
  /** Number of NFTs to mint (max supply) */
  quantity: number;
  /** Optional token memo shown by explorers */
  memo?: string;
  /** Optional auto-renew: account ID that pays rent (e.g., "0.0.1234") */
  autoRenewAccountId?: string;
  /** Auto-renew period in seconds (e.g., 90 days = 7776000) */
  autoRenewPeriodSeconds?: number;
};

export type NFTMintInput = {
  /** Base name used in per-serial metadata */
  name: string;
  /** Country of origin used in per-serial metadata */
  countryOfOrigin?: string;
  /** Price per unit used in metadata (2 decimals) */
  pricePerUnit?: number;
  /** HS code (optional) */
  hsCode?: string | number;
  /** How many to mint (≤ remaining max supply) */
  quantity: number;
};

export type NFTUpdateInput = {
  /** Optional new token name (collection display name) */
  name?: string;
  /** Optional new symbol (A-Z0-9 up to ~5–8 chars recommended) */
  symbol?: string;
  /** Optional token memo */
  memo?: string;
  /** Optional auto-renew account id */
  autoRenewAccountId?: string;
  /** Optional auto-renew period seconds */
  autoRenewPeriodSeconds?: number;
};

const MAX_UTF8_BYTES = 100; // keep metadata compact (Hedera best practice)
const DEFAULT_MAX_TX_FEE_HBAR = new Hbar(20);
const MINT_BATCH_SIZE = 10; // Hedera supports batching; 10 metadata entries per tx is a safe default

/* -------------------------------- Helpers -------------------------------- */

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

function getOperatorKey(): PrivateKey {
  return PrivateKey.fromString(requireEnv("HEDERA_PRIVATE_KEY"));
}

function getTreasuryAccountId(): string {
  return requireEnv("HEDERA_ACCOUNT_ID");
}

/** Trim string to fit byte budget in UTF-8 without breaking multibyte chars */
function fitUtf8(input: string, maxBytes: number): string {
  const buf = Buffer.from(input, "utf8");
  if (buf.byteLength <= maxBytes) return input;

  // binary search for max length that fits
  let lo = 0,
    hi = input.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const b = Buffer.byteLength(input.slice(0, mid), "utf8");
    if (b <= maxBytes) lo = mid;
    else hi = mid - 1;
  }
  return input.slice(0, lo);
}

function safeSymbolFromName(name: string, fallback = "PROD"): string {
  const s = (name || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 5)
    .toUpperCase();
  return s || fallback;
}

function mustPositiveInt(v: number, field: string): number {
  if (!Number.isFinite(v) || v <= 0) throw new Error(`${field} must be > 0`);
  return Math.floor(v);
}

/* ----------------------------- Create + Mint ------------------------------ */

export const CreateNftService = {
  /**
   * Creates an NFT collection and (optionally) mints the entire supply with compact on-chain metadata.
   * Returns the tokenId and (if a mint happened) the array of serials.
   */
  async createFull(
    data: NFTDataInput,
    mintInput?: NFTMintInput
  ): Promise<{ tokenId: string; serials?: number[] }> {
    const client: Client = getHederaClient();
    const operatorKey = getOperatorKey();
    const treasuryAccountId = getTreasuryAccountId();

    // You should use a persisted SUPPLY KEY you control; don’t generate one at runtime unless you store it.
    const supplyKeyStr = "3030020100300706052b8104000a04220420f00b73add472af9375f7f38763b3e9fe35acd6afd1adcbb0806de29911171514";
    const supplyKey = PrivateKey.fromString(supplyKeyStr);

    const maxSupply = mustPositiveInt(data.quantity, "quantity");
    const symbol = safeSymbolFromName(data.name);

    try {
      let tx = new TokenCreateTransaction()
        .setTokenName(`${data.name} Collection`)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryAccountId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(maxSupply)
        .setSupplyKey(supplyKey.publicKey)
        .setMaxTransactionFee(DEFAULT_MAX_TX_FEE_HBAR);

      if (data.memo) tx = tx.setTokenMemo(data.memo);
      if (data.autoRenewAccountId) {
        tx = tx.setAutoRenewAccountId(AccountId.fromString(data.autoRenewAccountId));
      }
      if (data.autoRenewPeriodSeconds) {
        tx = tx.setAutoRenewPeriod(data.autoRenewPeriodSeconds);
      }

      const signed = await tx.freezeWith(client).sign(operatorKey);
      const submit = await signed.execute(client);
      const receipt = await submit.getReceipt(client);
      const tokenId = receipt.tokenId?.toString();
      if (!tokenId) throw new Error("Token creation returned no tokenId.");

      // Optional mint right away
      if (!mintInput) return { tokenId };

      const serials = await MintProductNftService.mint(tokenId, mintInput);
      return { tokenId, serials };
    } catch (err) {
      console.error("Error during NFT collection creation:", err);
      throw err;
    }
  },
};

/* --------------------------------- Mint ---------------------------------- */

export const MintProductNftService = {
  /**
   * Mints `input.quantity` NFTs for an existing tokenId using SUPPLY KEY.
   * Each serial receives a compact UTF-8 metadata string:
   *   n=<name>; c=<country>; p=<price>; hs=<hs>; u=<i>/<total>
   */
  async mint(tokenId: string, input: NFTMintInput): Promise<number[]> {
    if (!tokenId) throw new Error("tokenId is required.");

    const client: Client = getHederaClient();
    const supplyKeyStr = "3030020100300706052b8104000a04220420f00b73add472af9375f7f38763b3e9fe35acd6afd1adcbb0806de29911171514";
    const supplyKey = PrivateKey.fromString(supplyKeyStr);

    const mintCount = mustPositiveInt(input.quantity, "quantity");
    const chunkSize = MINT_BATCH_SIZE;

    const name = (input.name ?? "").replace(/\s+/g, " ").trim();
    const country = (input.countryOfOrigin ?? "").trim();
    const price =
      typeof input.pricePerUnit === "number" && Number.isFinite(input.pricePerUnit)
        ? input.pricePerUnit.toFixed(2)
        : "0.00";
    const hs = (input.hsCode ?? "").toString().trim();

    const makeTextMetadata = (i: number): Buffer => {
      const serialOneBased = i + 1;
      let text = `n=${name}; c=${country}; p=${price};`;
      if (hs) text += ` hs=${hs};`;
      text += ` u=${serialOneBased}/${mintCount}`;
      const safe = fitUtf8(text, MAX_UTF8_BYTES);
      const size = Buffer.byteLength(safe, "utf8");
      if (size > MAX_UTF8_BYTES) {
        throw new Error(`Metadata exceeds ${MAX_UTF8_BYTES} bytes (${size}).`);
      }
      return Buffer.from(safe, "utf8");
    };

    const serials: number[] = [];

    for (let i = 0; i < mintCount; i += chunkSize) {
      const batch = Array.from(
        { length: Math.min(chunkSize, mintCount - i) },
        (_, k) => makeTextMetadata(i + k)
      );

      try {
        const mintTx = new TokenMintTransaction()
          .setTokenId(tokenId)
          .setMetadata(batch)
          .setMaxTransactionFee(DEFAULT_MAX_TX_FEE_HBAR)
          .freezeWith(client);

        const signedMintTx = await mintTx.sign(supplyKey);
        const mintSubmit = await signedMintTx.execute(client);
        const mintReceipt = await mintSubmit.getReceipt(client);

        for (const s of mintReceipt.serials) serials.push(Number(s.toString()));
      } catch (err) {
        console.error(`Error during minting batch starting at index ${i}:`, err);
        throw err;
      }
    }

    return serials;
  },
};

/* --------------------------------- Edit ---------------------------------- */

export const EditNftService = {
  /**
   * Updates editable, token-level fields for an existing NFT collection.
   * NOTE: Individual NFT **metadata for a given serial is immutable** on Hedera.
   */
  async updateByTokenId(tokenId: string, updates: NFTUpdateInput): Promise<{ tokenId: string }> {
    if (!tokenId) throw new Error("tokenId is required.");

    const client: Client = getHederaClient();
    const operatorKey = getOperatorKey();

    // Build update tx
    let tx = new TokenUpdateTransaction()
      .setTokenId(tokenId)
      .setMaxTransactionFee(DEFAULT_MAX_TX_FEE_HBAR);

    if (updates.name) tx = tx.setTokenName(updates.name);
    if (updates.symbol) tx = tx.setTokenSymbol(updates.symbol);
    if (typeof updates.memo === "string") tx = tx.setTokenMemo(updates.memo);
    if (updates.autoRenewAccountId) {
      tx = tx.setAutoRenewAccountId(AccountId.fromString(updates.autoRenewAccountId));
    }
    if (updates.autoRenewPeriodSeconds) {
      tx = tx.setAutoRenewPeriod(updates.autoRenewPeriodSeconds);
    }

    try {
      const signed = await tx.freezeWith(client).sign(operatorKey);
      const submit = await signed.execute(client);
      await submit.getReceipt(client);
      return { tokenId };
    } catch (err) {
      console.error(`Error updating token ${tokenId}:`, err);
      throw err;
    }
  },
};

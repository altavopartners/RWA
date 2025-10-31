import {
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  PrivateKey,
  Hbar,
} from "@hashgraph/sdk";
import { getHederaClient } from "../config/hedera";

export type CreateProductNFTInput = {
  name: string;
  quantity: number;
  countryOfOrigin: string;
  pricePerUnit: number;
  hsCode?: string | null;
};

export async function createProductNFT(input: CreateProductNFTInput) {
  console.log(`[NFT] Starting NFT creation for product: ${input.name}`);

  try {
    const client = getHederaClient();
    console.log(`[NFT] ✓ Client initialized`);

    const treasuryAccountId = process.env.HEDERA_ACCOUNT_ID!;
    console.log(`[NFT] Treasury account: ${treasuryAccountId}`);

    // ------------- Supply key for minting (must be different from operator for security) -------------
    console.log(`[NFT] Loading supply key...`);
    const supplyKey =
      process.env.HEDERA_SUPPLY_KEY && process.env.HEDERA_SUPPLY_KEY.trim()
        ? PrivateKey.fromStringED25519(process.env.HEDERA_SUPPLY_KEY)
        : PrivateKey.generateED25519();

    console.log(
      `[NFT] ✓ Supply key loaded, public: ${supplyKey.publicKey.toString()}`
    );

    // If you generated it here, persist it securely (KMS/secret store) for future mints.

    const symbol =
      input.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 5)
        .toUpperCase() || "PROD";

    let tokenId: string = "";
    try {
      console.log(`[NFT] Creating token transaction...`);

      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(`${input.name} Collection`)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryAccountId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(Math.max(1, input.quantity))
        .setSupplyKey(supplyKey.publicKey)
        .setMaxTransactionFee(new Hbar(50)); // Increased fee to ensure it's not a fee issue

      console.log(`[NFT] Freezing transaction with client...`);
      const frozenTx = await tokenCreateTx.freezeWith(client);
      console.log(`[NFT] ✓ Transaction frozen`);

      console.log(`[NFT] Executing transaction...`);
      const createSubmit = await frozenTx.execute(client);
      console.log(
        `[NFT] ✓ Transaction submitted with ID:`,
        createSubmit.transactionId?.toString()
      );

      console.log(`[NFT] Waiting for receipt (this may take 5-10 seconds)...`);
      const createReceipt = await createSubmit.getReceipt(client);
      tokenId = createReceipt.tokenId!.toString();

      console.log(`[NFT] ✅ Token created successfully: ${tokenId}`);
    } catch (err) {
      console.error(
        "[NFT] ❌ Error during token creation:",
        err instanceof Error ? err.message : JSON.stringify(err)
      );
      throw err;
    }

    // // -------------------- PATCH STARTS HERE --------------------
    // // On-chain metadata must be tiny. Store a pointer (IPFS or HTTPS).
    // // Configure one of these env vars:
    // //   - METADATA_CID (for IPFS): e.g. bafy...  -> ipfs://<CID>/<serial>
    // //   - METADATA_BASE_URL (for HTTPS): e.g. https://api.example.com/nft/PRD
    // const METADATA_CID = process.env.METADATA_CID; // optional
    // const METADATA_BASE_URL = process.env.METADATA_BASE_URL; // optional
    // const MAX_BYTES = 100; // safe ceiling per Hedera NFT metadata slot

    // const makePointer = (serialIndex: number) => {
    //   const serialOneBased = serialIndex + 1;
    //   if (METADATA_CID) {
    //     return `ipfs://${METADATA_CID}/${serialOneBased}`;
    //   }
    //   if (METADATA_BASE_URL) {
    //     return `${METADATA_BASE_URL}/${serialOneBased}`;
    //   }
    //   // Fallback: ultra-tiny JSON with just label + unit number
    //   // (Use only if you don't have IPFS/HTTP set up yet.)
    //   return JSON.stringify({
    //     p: (input.name || "PRD").slice(0, 12),
    //     n: serialOneBased,
    //   });
    // };

    // const makeMetadata = (i: number) => {
    //   const pointer = makePointer(i);
    //   const buf = Buffer.from(pointer, "utf8");
    //   const size = buf.byteLength;
    //   if (size > MAX_BYTES) {
    //     throw new Error(
    //       `NFT metadata too long (${size} bytes). Shorten your pointer (env) or switch to tiny JSON.`
    //     );
    //   }
    //   return buf;
    // };
    // // -------------------- PATCH ENDS HERE ----------------------

    // -------------------- PATCH STARTS HERE --------------------
    // Plain-text on-chain metadata with strict byte cap.
    // Hedera NFT metadata slot: keep at or below 100 bytes (UTF-8).
    const MAX_BYTES = 100;

    // Safely fit a UTF-8 string within max bytes, never splitting multibyte chars.
    function fitUtf8(text: string, maxBytes: number): string {
      const enc = Buffer.from(text, "utf8");
      if (enc.byteLength <= maxBytes) return text;

      // Reserve 1 byte for an ellipsis character if we need to truncate
      const ellipsis = "…";
      const maxNoEllipsis = Math.max(
        0,
        maxBytes - Buffer.from(ellipsis, "utf8").byteLength
      );

      // Fast path: binary search cut point
      let lo = 0,
        hi = text.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        const slice = text.slice(0, mid);
        if (Buffer.from(slice, "utf8").byteLength <= maxNoEllipsis) lo = mid;
        else hi = mid - 1;
      }
      const trimmed = text.slice(0, lo);
      return trimmed + ellipsis;
    }

    // Build compact, human-readable metadata for each serial.
    // Example: "n=WidgetA; c=US; p=12.50; hs=1234; u=3/250"
    function makeTextMetadata(
      i: number,
      total: number,
      input: CreateProductNFTInput
    ): Buffer {
      const serialOneBased = i + 1;

      // Short keys to conserve bytes
      const name = (input.name ?? "").replace(/\s+/g, " ").trim();
      const country = (input.countryOfOrigin ?? "").trim();
      const price = Number.isFinite(input.pricePerUnit)
        ? input.pricePerUnit.toFixed(2)
        : "0.00";
      const hs = (input.hsCode ?? "").toString().trim();

      // Compose minimal but informative line
      // Order chosen to keep most useful info up front in case truncation happens.
      let text = `n=${name}; c=${country}; p=${price};`;
      if (hs) text += ` hs=${hs};`;
      text += ` u=${serialOneBased}/${Math.max(1, total)}`;

      // Enforce the hard limit
      const safe = fitUtf8(text, MAX_BYTES);
      const size = Buffer.byteLength(safe, "utf8");
      if (size > MAX_BYTES) {
        // Should never happen due to fitUtf8, but keep a guard anyway.
        throw new Error(`Metadata still exceeds ${MAX_BYTES} bytes (${size}).`);
      }
      return Buffer.from(safe, "utf8");
    }
    // -------------------- PATCH ENDS HERE ----------------------

    const serials: number[] = [];
    const mintCount = Math.max(1, input.quantity);
    const chunkSize = 10; // Hedera allows up to 10 metadata entries per mint

    console.log(
      `[NFT] Starting minting loop: ${mintCount} NFTs in batches of ${chunkSize}`
    );

    // Restored loop using the new makeTextMetadata builder (keeps comments above intact)
    for (let i = 0; i < mintCount; i += chunkSize) {
      const batch = Array.from(
        { length: Math.min(chunkSize, mintCount - i) },
        (_, k) => makeTextMetadata(i + k, mintCount, input)
      );

      try {
        console.log(
          `[NFT] Minting batch [${i}-${Math.min(
            i + chunkSize - 1,
            mintCount - 1
          )}]...`
        );

        const mintTx = new TokenMintTransaction()
          .setTokenId(tokenId)
          .setMetadata(batch)
          .setMaxTransactionFee(new Hbar(20)) // ensure enough fee for batch mints
          .freezeWith(client);

        // IMPORTANT: sign mint with supplyKey (payer signature via operator is added by the Client)
        const signedMintTx = await mintTx.sign(supplyKey);
        const mintSubmit = await signedMintTx.execute(client);
        const mintReceipt = await mintSubmit.getReceipt(client);

        // Collect all minted serial numbers
        for (const s of mintReceipt.serials) {
          serials.push(Number(s.toString()));
        }

        console.log(
          `✅ Minted batch [${i}-${Math.min(
            i + chunkSize - 1,
            mintCount - 1
          )}] for token ${tokenId}. Serials: ${serials.join(", ")}`
        );
      } catch (err) {
        console.error(
          `❌ Error during minting batch starting at index ${i}:`,
          err instanceof Error ? err.message : JSON.stringify(err)
        );
        throw err;
      }
    }

    console.log(
      `[NFT] ✅ NFT creation complete! Token: ${tokenId}, Serials: ${serials.join(
        ", "
      )}`
    );
    return { tokenId, serials };
  } catch (err) {
    console.error(
      `[NFT] ❌ FATAL ERROR in createProductNFT:`,
      err instanceof Error ? err.message : JSON.stringify(err)
    );
    if (err instanceof Error) {
      console.error(`[NFT] Stack:`, err.stack);
    }
    throw err;
  }
}

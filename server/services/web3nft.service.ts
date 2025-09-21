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
  const client = getHederaClient();

  // Payer/treasury (assumes your operator is also the treasury)
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!);
  const treasuryAccountId = process.env.HEDERA_ACCOUNT_ID!;

  // ------------- Supply key -------------
  // Prefer loading from secure storage so you can mint later in another process.
  const supplyKey = process.env.HEDERA_SUPPLY_KEY
    ? PrivateKey.fromString(process.env.HEDERA_SUPPLY_KEY)
    : PrivateKey.generateED25519();
  // If you generated it here, persist it securely (KMS/secret store) for future mints.

  const symbol =
    input.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 5).toUpperCase() || "PROD";

  let tokenId: string = "";
  try {
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(`${input.name} Collection`)
      .setTokenSymbol(symbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)                // NFTs must be 0
      .setInitialSupply(0)           // NFTs must start at 0
      .setTreasuryAccountId(treasuryAccountId)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(Math.max(1, input.quantity))
      .setSupplyKey(supplyKey)       // REQUIRED for NFTs
      .setMaxTransactionFee(new Hbar(20))
      .freezeWith(client);

    // Sign by payer/treasury (operator). Supply key not required on create.
    const signedCreateTx = await tokenCreateTx.sign(operatorKey);
    const createSubmit = await signedCreateTx.execute(client);
    const createReceipt = await createSubmit.getReceipt(client);
    tokenId = createReceipt.tokenId!.toString();
  } catch (err) {
    console.error("Error during token creation:", err);
    throw err;
  }

  // -------------------- PATCH STARTS HERE --------------------
  // On-chain metadata must be tiny. Store a pointer (IPFS or HTTPS).
  // Configure one of these env vars:
  //   - METADATA_CID (for IPFS): e.g. bafy...  -> ipfs://<CID>/<serial>
  //   - METADATA_BASE_URL (for HTTPS): e.g. https://api.example.com/nft/PRD
  const METADATA_CID = process.env.METADATA_CID; // optional
  const METADATA_BASE_URL = process.env.METADATA_BASE_URL; // optional
  const MAX_BYTES = 100; // safe ceiling per Hedera NFT metadata slot

  const makePointer = (serialIndex: number) => {
    const serialOneBased = serialIndex + 1;
    if (METADATA_CID) {
      return `ipfs://${METADATA_CID}/${serialOneBased}`;
    }
    if (METADATA_BASE_URL) {
      return `${METADATA_BASE_URL}/${serialOneBased}`;
    }
    // Fallback: ultra-tiny JSON with just label + unit number
    // (Use only if you don't have IPFS/HTTP set up yet.)
    return JSON.stringify({
      p: (input.name || "PRD").slice(0, 12),
      n: serialOneBased,
    });
  };

  const makeMetadata = (i: number) => {
    const pointer = makePointer(i);
    const buf = Buffer.from(pointer, "utf8");
    const size = buf.byteLength;
    if (size > MAX_BYTES) {
      throw new Error(
        `NFT metadata too long (${size} bytes). Shorten your pointer (env) or switch to tiny JSON.`
      );
    }
    return buf;
  };
  // -------------------- PATCH ENDS HERE ----------------------

  const serials: number[] = [];
  const mintCount = Math.max(1, input.quantity);
  const chunkSize = 10; // Hedera allows up to 10 metadata entries per mint

  for (let i = 0; i < mintCount; i += chunkSize) {
    const batch = Array.from({ length: Math.min(chunkSize, mintCount - i) }, (_, k) =>
      makeMetadata(i + k)
    );

    try {
      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata(batch)
        .freezeWith(client);

      // // IMPORTANT: sign mint with supplyKey (payer signature via operator is added by the Client)
      // const signedMintTx = await mintTx.sign(supplyKey);
      // const mintSubmit = await signedMintTx.execute(client);
      // const mintReceipt = await mintSubmit.getReceipt(client);

      // for (const s of mintReceipt.serials) serials.push(Number(s.toString()));
    } catch (err) {
      console.error(`Error during minting batch starting at index ${i}:`, err);
      throw err;
    }
  }

  return { tokenId, serials };
}

// server/utils/w3.ts
import axios from "axios";

const nativeImport = (s: string) =>
  (Function("s", "return import(s)"))(s) as Promise<any>;

let _client: any | null = null;

// ---- CONFIG (no .env) ----
// Base64 principal string from `w3 key create --json` -> "key"
const STORACHA_PRINCIPAL_B64 =
  "MgCa92wIAJEDt7s2uxFmq1OReriMi++9/K10IN6JDWaqG/e0BcH8msh9LJBirhSVOEUbdOy1EhbxQX+7th5xFZiLbQY8=";
// DID from the same output -> "did"
const EXPECTED_AGENT_DID =
  "did:key:z6Mkn2QAH2vRn9kQmgJ6W92A315U5uZ3hN4aBcq9e3A5isKk";
// UCAN proof (base64) minted *for the agent DID* above
const PROOF_B64 = "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";

// -------- helpers (tolerate SDK shape differences) --------
function extractDidFromClient(c: any): string | undefined {
  try {
    if (c?.agent?.did) return typeof c.agent.did === "function" ? c.agent.did() : c.agent.did;
    if (c?.did) return typeof c.did === "function" ? c.did() : c.did;
  } catch {}
  return undefined;
}

function extractDidFromAud(aud: any): string | undefined {
  try {
    if (!aud) return undefined;
    if (typeof aud === "string") return aud;
    if (aud?.did) return typeof aud.did === "function" ? aud.did() : aud.did;
  } catch {}
  return undefined;
}

async function polyfillStreamsAndFile() {
  try {
    const web = await nativeImport("node:stream/web");
    Object.assign(globalThis as any, {
      ReadableStream: web.ReadableStream,
      WritableStream: web.WritableStream,
      TransformStream: web.TransformStream,
    });
  } catch {}
  (globalThis as any).Blob ??= (await nativeImport("buffer")).Blob;
  (globalThis as any).File ??= (await nativeImport("undici")).File;
}

// -----------------------------------------------------------

export async function getW3Client() {
  if (_client) return _client;

  await polyfillStreamsAndFile();

  // Robust dynamic imports
  const ClientMod = await nativeImport("@storacha/client");
  const createClient =
    ClientMod?.create ?? ClientMod?.default?.create ?? ClientMod?.default;
  if (typeof createClient !== "function") {
    throw new Error("Unable to resolve @storacha/client.create()");
  }

  const ProofMod = await nativeImport("@storacha/client/proof");
  const parseProof =
    ProofMod?.parse ?? ProofMod?.default?.parse ?? ProofMod?.default;
  if (typeof parseProof !== "function") {
    throw new Error("Unable to resolve @storacha/client/proof.parse()");
  }

  const EdSigner = await nativeImport("@ucanto/principal/ed25519");

  if (!STORACHA_PRINCIPAL_B64) {
    throw new Error(
      "Missing STORACHA_PRINCIPAL_B64. Generate one with `w3 key create --json` and paste the `key` value."
    );
  }

  // Create principal and verify DID
  const principal = EdSigner.Signer.parse(STORACHA_PRINCIPAL_B64);
  const principalDid =
    typeof principal.did === "function" ? principal.did() : principal.did;
  console.log("principal DID (from STORACHA_PRINCIPAL_B64):", principalDid);

  if (EXPECTED_AGENT_DID && principalDid !== EXPECTED_AGENT_DID) {
    throw new Error(
      `Configured principal DID != EXPECTED_AGENT_DID\n` +
        `principal=${principalDid}\nexpected=${EXPECTED_AGENT_DID}\n` +
        `Either update EXPECTED_AGENT_DID & PROOF_B64, or paste the matching principal into STORACHA_PRINCIPAL_B64.`
    );
  }

  // ---- Choose a store: try MemoryStore subpath; if missing, fall back to new FS store in temp dir
  let store: any | null = null;

  try {
    const MemStoreMod = await nativeImport("@web3-storage/w3up-client/stores/memory");
    const MemoryStore =
      MemStoreMod?.MemoryStore ?? MemStoreMod?.StoreMemory ?? MemStoreMod?.default ?? null;
    if (typeof MemoryStore === "function") {
      store = new MemoryStore(); // ✅ clean, in-memory (no persisted identity)
      console.log("[w3] Using MemoryStore (in-memory)");
    } else {
      console.warn("[w3] MemoryStore symbol not found, will fall back to FS store.");
    }
  } catch (e) {
    console.warn("[w3] MemoryStore module not available, will fall back to FS store.");
  }

  if (!store) {
    // FS fallback in a unique temp dir to avoid colliding with any old identity
    const os = await nativeImport("node:os");
    const path = await nativeImport("node:path");
    const { randomUUID } = await nativeImport("node:crypto");
    const FSMod = await nativeImport("@web3-storage/w3up-client/stores/fs");
    const FSStore = FSMod?.FSStore ?? FSMod?.default ?? FSMod;
    if (typeof FSStore !== "function") {
      throw new Error(
        "Could not resolve FSStore from @web3-storage/w3up-client/stores/fs"
      );
    }
    const root = path.join(os.tmpdir(), `w3up-store-${randomUUID()}`);
    store = new FSStore({ root });
    console.log("[w3] Using FS store at temp path:", root);
  }

  console.log("Creating Storacha client...");
  _client = await createClient({ principal, store } as any);
  console.log("Finished creating Storacha client.");

  // Read agent DID (robust to SDK differences)
  const agentDid = extractDidFromClient(_client);
  if (!agentDid) {
    console.error("Storacha client shape:", Object.keys(_client || {}));
    throw new Error("Unable to read agent DID from client (agent/did undefined).");
  }
  console.log("agent DID (from principal):", agentDid);

  if (EXPECTED_AGENT_DID && agentDid !== EXPECTED_AGENT_DID) {
    console.warn(
      `⚠️ Agent DID from principal != EXPECTED_AGENT_DID\n` +
        `derived=${agentDid}\nexpected=${EXPECTED_AGENT_DID}`
    );
  }

  // Add/select space from proof (only if provided)
  if (PROOF_B64) {
    const parsed = await parseProof(PROOF_B64).catch((e: any) => {
      throw new Error(`Failed to parse PROOF_B64: ${e?.message ?? e}`);
    });
    const space = await _client.addSpace(parsed);
    const spaceDid = typeof space?.did === "function" ? space.did() : space?.did;
    if (!spaceDid) {
      console.warn("Space object has no .did(); space keys:", Object.keys(space || {}));
    }
    await _client.setCurrentSpace(spaceDid ?? space);

    // Validate proof audience matches agent
    const audDid = extractDidFromAud(parsed?.aud);
    if (!audDid) {
      console.warn("Proof 'aud' has unexpected shape; parsed keys:", Object.keys(parsed || {}));
    } else if (audDid !== agentDid) {
      throw new Error(`UCAN audience DID mismatch: proof.aud=${audDid} vs agent=${agentDid}`);
    }
  } else {
    console.warn(
      "No PROOF_B64 provided — client created without selecting a space. Uploads may fail until a valid proof is added."
    );
  }

  return _client;
}
export function gatewayUrl(cid: string) {
  const base = "https://w3s.link".replace(/\/+$/, "");
  return `${base}/ipfs/${cid}`;
}
export async function w3Upload(buffer: Buffer, filename: string, mime?: string) {
    const c = await getW3Client();
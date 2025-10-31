import axios from "axios";
const nativeImport = (s: string) =>
  (Function("s", "return import(s)"))(s) as Promise<any>;
let _client: any | null = null;
const STORACHA_PRINCIPAL_B64 = "...";
const EXPECTED_AGENT_DID = "...";
const PROOF_B64 = "...";
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
    ); }
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
  console.log("Creating Storacha client...");
  _client = await createClient({ principal, store } as any);
  console.log("Finished creating Storacha client.");
  // Read agent DID (robust to SDK differences)
  const agentDid = extractDidFromClient(_client);
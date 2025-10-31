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
    ); 
}

  // Create principal and verify DID
  const principal = EdSigner.Signer.parse(STORACHA_PRINCIPAL_B64);
  const principalDid =
    typeof principal.did === "function" ? principal.did() : principal.did;
  console.log("principal DID (from STORACHA_PRINCIPAL_B64):", principalDid);

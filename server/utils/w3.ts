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

function extractDidFromAud(aud: any): string | undefined { ... }

import axios from "axios";
const nativeImport = (s: string) =>
  (Function("s", "return import(s)"))(s) as Promise<any>;
let _client: any | null = null;
const STORACHA_PRINCIPAL_B64 = "...";
const EXPECTED_AGENT_DID = "...";
const PROOF_B64 = "...";
function extractDidFromClient(c: any): string | undefined { ... }

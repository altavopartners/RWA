"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getW3Client = getW3Client;
exports.gatewayUrl = gatewayUrl;
exports.w3Upload = w3Upload;
exports.w3FetchBytes = w3FetchBytes;
// server/utils/w3.ts
const axios_1 = __importDefault(require("axios"));
const nativeImport = (s) => Function("s", "return import(s)")(s);
let _client = null;
// ---- CONFIG (read from env or fallback to hardcoded) ----
const STORACHA_SEED_HEX = process.env.STORACHA_SEED_HEX ||
    "f6f147f53afefa05cfc6be2ec5cc9bdd31736357dfb60087cf788c3cc11b2d9b";
const EXPECTED_AGENT_DID = process.env.EXPECTED_AGENT_DID ||
    "did:key:z6Mkvo1JewWRDxx3byA2VJMc5PHpW4YZAebudSP5bKqFJHNx";
// W3_PROOF_BASE64 from env (delegation proof for the agent DID)
const PROOF_B64 = process.env.W3_PROOF_BASE64 ||
    "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";
// -------- helpers (tolerate SDK shape differences) --------
function extractDidFromClient(c) {
    try {
        if (c?.agent?.did)
            return typeof c.agent.did === "function" ? c.agent.did() : c.agent.did;
        if (c?.did)
            return typeof c.did === "function" ? c.did() : c.did;
    }
    catch { }
    return undefined;
}
function extractDidFromAud(aud) {
    try {
        if (!aud)
            return undefined;
        if (typeof aud === "string")
            return aud;
        if (aud.did)
            return typeof aud.did === "function" ? aud.did() : aud.did;
    }
    catch { }
    return undefined;
}
async function polyfillStreamsAndFile() {
    var _a, _b;
    try {
        const web = await nativeImport("node:stream/web");
        Object.assign(globalThis, {
            ReadableStream: web.ReadableStream,
            WritableStream: web.WritableStream,
            TransformStream: web.TransformStream,
        });
    }
    catch { }
    (_a = globalThis).Blob ?? (_a.Blob = (await nativeImport("buffer")).Blob);
    (_b = globalThis).File ?? (_b.File = (await nativeImport("undici")).File);
}
// -----------------------------------------------------------
async function getW3Client() {
    if (_client)
        return _client;
    await polyfillStreamsAndFile();
    const Client = await nativeImport("@storacha/client");
    const Proof = await nativeImport("@storacha/client/proof");
    // Create deterministic client from fixed seed
    const seed = Buffer.from(STORACHA_SEED_HEX, "hex");
    _client = await Client.create({ seed });
    // Read agent DID (robust to SDK differences)
    const agentDid = extractDidFromClient(_client);
    if (!agentDid) {
        // Show structure to help debugging locally
        console.error("Storacha client shape:", Object.keys(_client || {}));
        throw new Error("Unable to read agent DID from client (agent/did undefined).");
    }
    console.log("agent DID (derived from seed):", agentDid);
    if (EXPECTED_AGENT_DID && agentDid !== EXPECTED_AGENT_DID) {
        console.warn(`⚠️ Agent DID derived from seed != EXPECTED_AGENT_DID\n` +
            `derived=${agentDid}\nexpected=${EXPECTED_AGENT_DID}`);
    }
    // Add/select space from proof
    const parsed = await Proof.parse(PROOF_B64);
    const space = await _client.addSpace(parsed);
    // space.did can be func or string
    const spaceDid = typeof space?.did === "function" ? space.did() : space?.did;
    if (!spaceDid) {
        console.warn("Space object has no .did(); space keys:", Object.keys(space || {}));
    }
    await _client.setCurrentSpace(spaceDid ?? space);
    // Validate proof audience matches agent
    const audDid = extractDidFromAud(parsed?.aud);
    if (!audDid) {
        console.warn("Proof 'aud' has unexpected shape; parsed keys:", Object.keys(parsed || {}));
    }
    else if (audDid !== agentDid) {
        throw new Error(`UCAN audience DID mismatch: proof.aud=${audDid} vs agent=${agentDid}`);
    }
    return _client;
}
function gatewayUrl(cid) {
    const gateway = process.env.IPFS_GATEWAY_URL || "https://w3s.link";
    const base = gateway.replace(/\/+$/, "");
    return `${base}/ipfs/${cid}`;
}
async function w3Upload(buffer, filename, mime) {
    const c = await getW3Client();
    const file = new File([buffer], filename, mime ? { type: mime } : {});
    const cid = await c.uploadFile(file);
    return cid.toString();
}
async function w3FetchBytes(cid) {
    const url = gatewayUrl(cid);
    const res = await axios_1.default.get(url, {
        responseType: "arraybuffer",
    });
    return Buffer.from(res.data);
}
//# sourceMappingURL=w3.js.map
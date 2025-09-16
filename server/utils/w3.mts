// server/utils/w3.ts
// Works in CommonJS (ts-node) by using dynamic ESM imports for w3up client.
import axios from "axios";

// Lazy singleton
let _client: any | null = null;

export async function getW3Client() {
  if (_client) return _client;

  // Dynamically import ESM modules
  const Client = await import("@web3-storage/w3up-client");
  const stores = await import("@web3-storage/w3up-client/stores/memory");
  const Proof = await import("@web3-storage/w3up-client/proof");
  const ed25519 = await import("@web3-storage/w3up-client/principal/ed25519");
  await import("web-file-polyfill"); // provides global File/Blob in Node

  const principal = ed25519.Signer.parse(process.env.W3_PRIVATE_KEY!);
  const store = new stores.StoreMemory();
  _client = await Client.create({ principal, store });

  const proof = await Proof.parse(process.env.W3_PROOF_BASE64!);
  const space = await _client.addSpace(proof);
  await _client.setCurrentSpace(process.env.W3_SPACE_DID ?? space.did());

  return _client;
}

export function gatewayUrl(cid: string) {
  const base = (process.env.IPFS_GATEWAY_URL ?? "https://w3s.link").replace(/\/+$/, "");
  return `${base}/ipfs/${cid}`;
}

export async function w3Upload(buffer: Buffer, filename: string, mime?: string) {
  const c = await getW3Client();
  // File is available thanks to web-file-polyfill
  const file = new File([buffer], filename, mime ? { type: mime } : {});
  const cid = await c.uploadFile(file);
  return cid.toString();
}

/** Download bytes via the configured gateway */
export async function w3FetchBytes(cid: string): Promise<Buffer> {
  const url = gatewayUrl(cid);
  const res = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

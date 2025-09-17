// server/utils/w3.esm.mjs  (PURE ESM)
// This avoids CJS -> ESM require() issues by keeping w3up imports in ESM-land.

import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Proof from "@web3-storage/w3up-client/proof";
import "web-file-polyfill"; // File/Blob for Node

let _client = null;

function loadProofFromFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const looksJson = raw.startsWith("{") || raw.startsWith("[");
  if (looksJson) return raw;
  const json = Buffer.from(raw, "base64").toString("utf8").trim();
  if (!json.startsWith("{") && !json.startsWith("[")) {
    throw new Error(`Proof at ${filePath} is not valid JSON or base64-encoded JSON.`);
  }
  return json;
}

export async function getW3Client() {
  if (_client) return _client;


  const store = new StoreMemory();
  _client = await Client.create({ store });

  const parsed = await Proof.parse("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");

  const space = await _client.addSpace(parsed);
  const targetDid = process.env.W3_SPACE_DID ?? space.did();
  await _client.setCurrentSpace(targetDid);

  return _client;
}

export function gatewayUrl(cid) {
  const base = (process.env.IPFS_GATEWAY_URL ?? "https://w3s.link").replace(/\/+$/, "");
  return `${base}/ipfs/${cid}`;
}

export async function w3Upload(buffer, filename, mime) {
  const c = await getW3Client();
  const file = new File([buffer], filename, mime ? { type: mime } : {});
  const cid = await c.uploadFile(file);
  return cid.toString();
}

export async function w3FetchBytes(cid) {
  const url = gatewayUrl(cid);
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

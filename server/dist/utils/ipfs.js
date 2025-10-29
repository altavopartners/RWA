"use strict";
// src/utils/ipfs.ts
// Utility functions for interacting with an IPFS node (e.g., local Kubo, Filebase, Pinata).
//
// Uses `axios` for straightforward HTTP requests to the IPFS API (`/api/v0/add`) and Gateway.
// Advantages: Simplicity, compatibility, stability, and avoids complex IPFS client SDK dependencies.
// Functions:
// - `uploadToIPFS(content)`: Uploads a string or Buffer to IPFS, returning the Content Identifier (CID).
// - `getFromIPFS(cid)`: Fetches text content from IPFS using the gateway.
// - `getBytesFromIPFS(cid)`: Fetches raw binary data (e.g., images) from IPFS.
// Relies on `IPFS_API_URL` and `IPFS_GATEWAY_URL` environment variables.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToIPFS = uploadToIPFS;
exports.getFromIPFS = getFromIPFS;
exports.getBytesFromIPFS = getBytesFromIPFS;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
// Use environment variable instead of hardcoded URL
const IPFS_API = process.env.IPFS_API_URL
    ? `${process.env.IPFS_API_URL}/api/v0`
    : "http://127.0.0.1:5001/api/v0";
const IPFS_GATEWAY = process.env.IPFS_GATEWAY_URL
    ? `${process.env.IPFS_GATEWAY_URL}/ipfs`
    : "http://127.0.0.1:8082/ipfs";
/**
 * Upload a string or Buffer to IPFS
 * @param content - string or binary Buffer to store
 * @returns CID (string) of the stored file
 */
async function uploadToIPFS(content) {
    const formData = new form_data_1.default();
    // If it's plain text, wrap into Buffer
    if (typeof content === "string") {
        formData.append("file", Buffer.from(content), { filename: "file.txt" });
    }
    else {
        formData.append("file", content, { filename: "file.bin" });
    }
    // POST request to IPFS node API with proper typing
    const res = await axios_1.default.post(`${IPFS_API}/add`, formData, {
        headers: formData.getHeaders(),
    });
    // Response contains CID under res.data.Hash
    return res.data.Hash;
}
/**
 * Fetch text content back from IPFS
 * Uses the local IPFS Gateway (port 8080)
 * @param cid - CID string
 * @returns text content
 */
async function getFromIPFS(cid) {
    const res = await axios_1.default.get(`${IPFS_GATEWAY}/${cid}`);
    return res.data;
}
/**
 * Fetch raw binary data from IPFS
 * Useful for images, PDFs, etc.
 * @param cid - CID string
 * @returns Buffer with file content
 */
async function getBytesFromIPFS(cid) {
    const res = await axios_1.default.get(`${IPFS_GATEWAY}/${cid}`, {
        responseType: "arraybuffer", // important for binary data
    });
    return Buffer.from(res.data);
}
//# sourceMappingURL=ipfs.js.map
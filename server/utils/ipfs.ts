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

import axios from "axios";
import FormData from "form-data";

// Use environment variable instead of hardcoded URL
const IPFS_API = process.env.IPFS_API_URL 
  ? `${process.env.IPFS_API_URL}/api/v0` 
  : "http://127.0.0.1:5001/api/v0";

const IPFS_GATEWAY = process.env.IPFS_GATEWAY_URL 
  ? `${process.env.IPFS_GATEWAY_URL}/ipfs` 
  : "http://127.0.0.1:8082/ipfs";

// Define response types
interface IpfsAddResponse {
  Hash: string;
  Size: string;
  Name: string;
}

/**
 * Upload a string or Buffer to IPFS
 * @param content - string or binary Buffer to store
 * @returns CID (string) of the stored file
 */
export async function uploadToIPFS(content: string | Buffer): Promise<string> {
  const formData = new FormData();

  // If it's plain text, wrap into Buffer
  if (typeof content === "string") {
    formData.append("file", Buffer.from(content), { filename: "file.txt" });
  } else {
    formData.append("file", content, { filename: "file.bin" });
  }

  // POST request to IPFS node API with proper typing
  const res = await axios.post<IpfsAddResponse>(
    `${IPFS_API}/add`, 
    formData, 
    {
      headers: formData.getHeaders(),
    }
  );

  // Response contains CID under res.data.Hash
  return res.data.Hash;
}

/**
 * Fetch text content back from IPFS
 * Uses the local IPFS Gateway (port 8080)
 * @param cid - CID string
 * @returns text content
 */
export async function getFromIPFS(cid: string): Promise<string> {
  const res = await axios.get<string>(`${IPFS_GATEWAY}/${cid}`);
  return res.data;
}

/**
 * Fetch raw binary data from IPFS
 * Useful for images, PDFs, etc.
 * @param cid - CID string
 * @returns Buffer with file content
 */
export async function getBytesFromIPFS(cid: string): Promise<Buffer> {
  const res = await axios.get<ArrayBuffer>(
    `${IPFS_GATEWAY}/${cid}`, 
    {
      responseType: "arraybuffer", // important for binary data
    }
  );
  
  return Buffer.from(res.data);
}
/**
 * Upload a JSON object to IPFS
 * @param obj - JSON object
 * @returns CID (string)
 */
export async function uploadJSONToIPFS(obj: object): Promise<string> {
  const jsonString = JSON.stringify(obj);
  return uploadToIPFS(jsonString);
}
/**
 * Fetch JSON from IPFS and parse it
 * @param cid - CID string
 * @returns Parsed JSON object
 */
export async function getJSONFromIPFS<T = any>(cid: string): Promise<T> {
  const text = await getFromIPFS(cid);
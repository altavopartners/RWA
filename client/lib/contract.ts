import { BrowserProvider, Contract } from "ethers";
import SplitPayArtifact from "@/lib/abi/SplitPay.json";

export const SPLITTER_ADDRESS = process.env.NEXT_PUBLIC_SPLITTER_ADDRESS!;
const SPLITTER_ABI = SplitPayArtifact.abi;

export async function getSplitPayContract() {
  if (!window?.ethereum) throw new Error("MetaMask not detected.");
  const provider = new BrowserProvider(window.ethereum as any);
  await provider.send("eth_requestAccounts", []); // good to add
  const signer = await provider.getSigner();
  return new Contract(SPLITTER_ADDRESS, SPLITTER_ABI, signer);
}

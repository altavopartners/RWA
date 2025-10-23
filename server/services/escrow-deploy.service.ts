// server/services/escrow-deploy.service.ts
import { ethers } from "ethers";
import path from "path";
import fs from "fs";

// Load compiled contract artifact
const ESCROW_ARTIFACT_PATH = path.join(
  __dirname,
  "../../hedera-escrow/artifacts/contracts/Escrow.sol/Escrow.json"
);

interface DeployEscrowParams {
  buyerAddress: string;
  sellerAddress: string;
  totalAmount: string; // in HBAR as string (e.g., "1.5")
}

interface DeployEscrowResult {
  contractAddress: string;
  transactionHash: string;
  arbiterAddress: string;
}

/**
 * Deploy a new Escrow contract to Hedera testnet for a specific order
 * Arbiter = platform wallet (from HEDERA_PRIVATE_KEY)
 */
export async function deployEscrowContract(
  params: DeployEscrowParams
): Promise<DeployEscrowResult> {
  const { buyerAddress, sellerAddress, totalAmount } = params;

  // Validate addresses
  if (!ethers.isAddress(buyerAddress) || !ethers.isAddress(sellerAddress)) {
    throw new Error("Invalid Ethereum address provided");
  }

  // Load environment
  const HEDERA_RPC =
    process.env.HEDERA_TESTNET_RPC || "https://testnet.hashio.io/api";
  const HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY;

  if (!HEDERA_PRIVATE_KEY) {
    throw new Error("HEDERA_PRIVATE_KEY not configured in environment");
  }

  // Setup provider and wallet (arbiter = platform)
  const provider = new ethers.JsonRpcProvider(HEDERA_RPC);
  const wallet = new ethers.Wallet(HEDERA_PRIVATE_KEY, provider);
  const arbiterAddress = wallet.address;

  // Load contract artifact
  if (!fs.existsSync(ESCROW_ARTIFACT_PATH)) {
    throw new Error(
      `Escrow contract artifact not found at ${ESCROW_ARTIFACT_PATH}. Run: cd hedera-escrow && npx hardhat compile`
    );
  }

  const artifact = JSON.parse(fs.readFileSync(ESCROW_ARTIFACT_PATH, "utf-8"));
  const { abi, bytecode } = artifact;

  // Create contract factory
  const EscrowFactory = new ethers.ContractFactory(abi, bytecode, wallet);

  // Convert totalAmount to wei
  const value = ethers.parseUnits(totalAmount, "ether");

  console.log("🚀 Deploying Escrow contract...");
  console.log("  Buyer:", buyerAddress);
  console.log("  Seller:", sellerAddress);
  console.log("  Arbiter (Platform):", arbiterAddress);
  console.log("  Total Amount:", totalAmount, "HBAR");

  // Deploy contract with buyer, seller, arbiter (no value sent at deploy)
  const escrow = await EscrowFactory.deploy(
    buyerAddress,
    sellerAddress,
    arbiterAddress
  );

  // Wait for deployment
  await escrow.waitForDeployment();
  const contractAddress = await escrow.getAddress();
  const deployTx = escrow.deploymentTransaction();

  if (!deployTx) {
    throw new Error("Deployment transaction not found");
  }

  const receipt = await deployTx.wait();
  if (!receipt) {
    throw new Error("Deployment receipt not found");
  }

  console.log("✅ Escrow deployed at:", contractAddress);
  console.log("   Transaction hash:", receipt.hash);

  return {
    contractAddress,
    transactionHash: receipt.hash,
    arbiterAddress,
  };
}

/**
 * Get escrow contract instance for interactions
 */
export async function getEscrowContract(contractAddress: string) {
  const HEDERA_RPC =
    process.env.HEDERA_TESTNET_RPC || "https://testnet.hashio.io/api";
  const HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY;

  if (!HEDERA_PRIVATE_KEY) {
    throw new Error("HEDERA_PRIVATE_KEY not configured");
  }

  const provider = new ethers.JsonRpcProvider(HEDERA_RPC);
  const wallet = new ethers.Wallet(HEDERA_PRIVATE_KEY, provider);

  const artifact = JSON.parse(fs.readFileSync(ESCROW_ARTIFACT_PATH, "utf-8"));
  const { abi } = artifact;

  return new ethers.Contract(contractAddress, abi, wallet);
}

/**
 * Platform marks buyer's bank as approved
 */
export async function approveBuyerBank(escrowAddress: string) {
  console.log(`📋 Approving buyer bank for escrow ${escrowAddress}`);
  const escrow = await getEscrowContract(escrowAddress);
  const tx = await escrow.approveBuyerBank();
  const receipt = await tx.wait();
  console.log("✅ Buyer bank approved, tx:", receipt.hash);
  return { transactionHash: receipt.hash };
}

/**
 * Platform marks seller's bank as approved
 */
export async function approveSellerBank(escrowAddress: string) {
  console.log(`📋 Approving seller bank for escrow ${escrowAddress}`);
  const escrow = await getEscrowContract(escrowAddress);
  const tx = await escrow.approveSellerBank();
  const receipt = await tx.wait();
  console.log("✅ Seller bank approved, tx:", receipt.hash);
  return { transactionHash: receipt.hash };
}

/**
 * Release first 50% payment after both banks approve
 */
export async function releaseFirstPayment(escrowAddress: string) {
  console.log(`💰 Releasing first 50% payment for escrow ${escrowAddress}`);
  const escrow = await getEscrowContract(escrowAddress);
  const tx = await escrow.releaseFirstPayment();
  const receipt = await tx.wait();
  console.log("✅ First payment (50%) released to seller, tx:", receipt.hash);
  return { transactionHash: receipt.hash };
}

/**
 * Confirm delivery and release final 50% payment
 */
export async function confirmDelivery(escrowAddress: string) {
  console.log(`📦 Confirming delivery for escrow ${escrowAddress}`);
  const escrow = await getEscrowContract(escrowAddress);
  const tx = await escrow.confirmDelivery();
  const receipt = await tx.wait();
  console.log("✅ Delivery confirmed, final 50% released, tx:", receipt.hash);
  return { transactionHash: receipt.hash };
}

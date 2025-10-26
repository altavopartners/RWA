// server/services/escrow-deploy.service.ts
import { ethers } from "ethers";
import path from "path";
import fs from "fs";

// Load compiled contract artifact
// From source: server/services/escrow-deploy.service.ts
// When compiled: server/dist/services/escrow-deploy.service.js
// __dirname will be: ...server/dist/services
// So go up 3 levels and into hedera-escrow
const ESCROW_ARTIFACT_PATH = path.resolve(
  __dirname,
  "../../../hedera-escrow/artifacts/contracts/Escrow.sol/Escrow.json"
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

  console.log("📋 Escrow deployment config:");
  console.log("  Artifact path:", ESCROW_ARTIFACT_PATH);
  console.log("  Artifact exists:", fs.existsSync(ESCROW_ARTIFACT_PATH));

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
 * Buyer approves in escrow contract
 * NOTE: This must be called by the buyer's wallet directly (frontend)
 * Kept for reference/docs - not used in backend
 */
export async function approveBuyerBank(
  escrowAddress: string,
  buyerWalletAddress: string
) {
  console.log(
    `📋 Approving buyer in escrow ${escrowAddress} from ${buyerWalletAddress}`
  );
  // This should be called from the frontend with buyer's wallet
  // Backend cannot call this without buyer's private key
  throw new Error(
    "Buyer approval must be initiated from the frontend with MetaMask signature"
  );
}

/**
 * Seller approves in escrow contract
 * NOTE: This must be called by the seller's wallet directly (frontend)
 * Kept for reference/docs - not used in backend
 */
export async function approveSellerBank(
  escrowAddress: string,
  sellerWalletAddress: string
) {
  console.log(
    `📋 Approving seller in escrow ${escrowAddress} from ${sellerWalletAddress}`
  );
  // This should be called from the frontend with seller's wallet
  // Backend cannot call this without seller's private key
  throw new Error(
    "Seller approval must be initiated from the frontend with MetaMask signature"
  );
}

/**
 * Arbiter confirms shipment and releases first 50% payment
 */
export async function releaseFirstPayment(escrowAddress: string) {
  console.log(
    `💰 Confirming shipment and releasing first 50% for escrow ${escrowAddress}`
  );
  const escrow = await getEscrowContract(escrowAddress);
  const tx = await escrow.confirmShipment();
  const receipt = await tx.wait();
  console.log(
    "✅ Shipment confirmed, first payment (50%) released to seller, tx:",
    receipt.hash
  );
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

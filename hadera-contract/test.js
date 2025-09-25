// test-splitExact.js
// Usage examples:
//   CONTRACT_ADDRESS=0xYourDeployedAddress node test-splitExact.js
//   DEPLOY_BYTECODE=0x600... (full bytecode) node test-splitExact.js
//
// Env vars:
//   RPC_URL            (default: http://127.0.0.1:8545)
//   PRIVATE_KEY        (default: first Hardhat/Anvil key if provided; otherwise required)
//   CONTRACT_ADDRESS   (use if already deployed)
//   DEPLOY_BYTECODE    (optional: if provided, script will deploy)
//   SEND_TO1, SEND_TO2 (optional: recipients; defaults to two test addresses)

import { ethers } from "ethers";

// ---- Config ----
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY; // required unless your local node auto-unlocks accounts
const ALREADY_DEPLOYED = process.env.CONTRACT_ADDRESS;
const DEPLOY_BYTECODE = process.env.DEPLOY_BYTECODE; // compiled bytecode if you want this script to deploy

// Two recipients (change as needed)
const TO1 = process.env.SEND_TO1 || "0x0000000000000000000000000000000000000A11";
const TO2 = process.env.SEND_TO2 || "0x0000000000000000000000000000000000000B22";

// Send 0.1 and 0.2 ETH by default
const AMT1_ETH = "0.1";
const AMT2_ETH = "0.2";

// Minimal ABI (events + function)
const ABI = [
  // events
  "event Paid(address indexed payer, uint256 total, uint256 nRecipients)",
  "event PaidOne(uint256 indexed index, address indexed to, uint256 amount, bool ok)",
  // errors (optional but nice to decode on revert)
  "error LengthMismatch()",
  "error AmountMismatch(uint256 expected, uint256 provided)",
  "error ZeroRecipient(uint256 index)",
  // function
  "function splitExact(address[] recipients, uint256[] amounts) external payable"
];

// (Optional) Constructor-less bytecode is expected. If you compiled with solc/hardhat/foundry,
// paste the full 0x… bytecode into DEPLOY_BYTECODE. No constructor args for this contract.

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Use provided private key or first unlocked account (if your node supports it)
  let wallet;
  if (PRIVATE_KEY) {
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  } else {
    // Attempt to use first unlocked account (Hardhat/Anvil often support this)
    const accounts = await provider.listAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error("No PRIVATE_KEY and no unlocked accounts found.");
    }
    wallet = provider.getSigner(accounts[0].address);
  }

  const iface = new ethers.Interface(ABI);

  // Deploy if requested
  let contractAddress = ALREADY_DEPLOYED;
  if (!contractAddress) {
    if (!DEPLOY_BYTECODE) {
      throw new Error("Set CONTRACT_ADDRESS or provide DEPLOY_BYTECODE to deploy.");
    }
    console.log("Deploying SplitPay...");
    const factory = new ethers.ContractFactory(ABI, DEPLOY_BYTECODE, wallet);
    const contract = await factory.deploy();
    const receipt = await contract.deploymentTransaction().wait();
    contractAddress = await contract.getAddress();
    console.log("Deployed at:", contractAddress, " (tx:", receipt.hash, ")");
  } else {
    console.log("Using existing contract at:", contractAddress);
  }

  const contract = new ethers.Contract(contractAddress, ABI, wallet);

  // --- Happy path call ---
  const recipients = [TO1, TO2];
  const amounts = [
    ethers.parseEther(AMT1_ETH),
    ethers.parseEther(AMT2_ETH)
  ];
  const total = amounts.reduce((a, b) => a + b, 0n);

  console.log("\nCalling splitExact (happy path)...");
  console.log("Recipients:", recipients);
  console.log("Amounts:", amounts.map(a => a.toString()), "wei");
  const tx = await contract.splitExact(recipients, amounts, { value: total });
  const rc = await tx.wait();
  console.log("Tx mined:", rc.hash);

  // Parse logs
  for (const log of rc.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "PaidOne") {
        console.log(`PaidOne -> index=${parsed.args.index} to=${parsed.args.to} amount=${parsed.args.amount.toString()} ok=${parsed.args.ok}`);
      }
      if (parsed?.name === "Paid") {
        console.log(`Paid -> payer=${parsed.args.payer} total=${parsed.args.total.toString()} nRecipients=${parsed.args.nRecipients}`);
      }
    } catch {
      // not our event
    }
  }

  // --- Negative test: mismatched sum (should revert) ---
  try {
    console.log("\nCalling splitExact (negative: mismatched sum)...");
    const badAmounts = [ethers.parseEther("1.0"), ethers.parseEther("2.0")];
    const badTotal = ethers.parseEther("1.5"); // value != sum(amounts)
    const tx2 = await contract.splitExact(recipients, badAmounts, { value: badTotal });
    await tx2.wait();
    console.log("Unexpected: negative test did NOT revert");
  } catch (err) {
    decodeRevert(err, iface);
  }

  // --- Negative test: zero recipient (should revert) ---
  try {
    console.log("\nCalling splitExact (negative: zero recipient)...");
    const zeroRecipients = [ethers.ZeroAddress, TO2];
    const okAmounts = [ethers.parseEther("0.05"), ethers.parseEther("0.05")];
    const okTotal = okAmounts[0] + okAmounts[1];
    const tx3 = await contract.splitExact(zeroRecipients, okAmounts, { value: okTotal });
    await tx3.wait();
    console.log("Unexpected: zero recipient test did NOT revert");
  } catch (err) {
    decodeRevert(err, iface);
  }

  console.log("\nDone.");
}

function decodeRevert(err, iface) {
  // ethers v6 revert info is usually in err.info?.error?.data or err.shortMessage
  const data =
    err?.info?.error?.data ||
    err?.data ||
    err?.error?.data ||
    err?.info?.receipt?.revertReason ||
    null;

  console.log("Reverted as expected.");
  if (typeof err?.shortMessage === "string") {
    console.log("shortMessage:", err.shortMessage);
  }

  if (data && typeof data === "string" && data.startsWith("0x") && data.length >= 10) {
    try {
      const decoded = iface.parseError(data);
      console.log("Decoded custom error:", decoded?.name, decoded?.args);
      return;
    } catch {
      // Not a custom error signature; ignore
    }
  }
  if (err?.message) console.log("message:", err.message);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

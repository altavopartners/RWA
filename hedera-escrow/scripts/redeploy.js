// scripts/redeploy.js
// Quick deployment script for testing new contract version
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "🚀 Deploying NEW Escrow contract with account:",
    deployer.address
  );

  const Escrow = await ethers.getContractFactory("Escrow");

  // Use real addresses from environment or defaults
  const buyer =
    process.env.BUYER_ADDRESS || "0xdbdaeF88839e18feF4E9C148b865bcC89dD44482";
  const seller =
    process.env.SELLER_ADDRESS || "0xdbdaeF88839e18feF4E9C148b865bcC89dD44482";
  const arbiter = deployer.address; // the platform/bank wallet

  // Get amount from args or default
  const amount = process.argv[2] || "1.0"; // 1 HBAR
  const totalAmount = ethers.parseUnits(amount, "ether");

  console.log("📋 Deployment config:");
  console.log("  Buyer:", buyer);
  console.log("  Seller:", seller);
  console.log("  Arbiter (Platform):", arbiter);
  console.log("  Amount:", amount, "HBAR");

  // Deploy contract
  const escrow = await Escrow.deploy(buyer, seller, arbiter, {
    value: totalAmount,
  });
  const receipt = await escrow.deploymentTransaction().wait();

  console.log("\n✅ NEW Escrow contract deployed!");
  console.log("   Contract Address: " + escrow.target);
  console.log("   Transaction Hash: " + receipt.hash);
  console.log("\n🔧 Use this address for the order:");
  console.log("   export NEXT_PUBLIC_ESCROW_CONTRACT=" + escrow.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

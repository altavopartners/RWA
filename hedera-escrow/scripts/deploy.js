// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", await deployer.getAddress());

  const Escrow = await hre.ethers.getContractFactory("Escrow");

  // Replace with real buyer/seller addresses
  const buyer = "0xdbdaeF88839e18feF4E9C148b865bcC89dD44482";
  const seller = "0xdbdaeF88839e18feF4E9C148b865bcC89dD44482";
  const arbiter = await deployer.getAddress(); // can also set a bank/platform account

  const totalAmount = hre.ethers.parseUnits("1.0", "ether"); // 1 HBAR

  console.log("Deploying Escrow contract...");
  const escrow = await Escrow.deploy(buyer, seller, arbiter, {
    value: totalAmount,
  });

  await escrow.waitForDeployment(); // ✅ Ethers v6 way to ensure deployment finished

  const address = await escrow.getAddress();
  const txHash = (await escrow.deploymentTransaction()).hash;

  console.log("Transaction hash:", txHash);
  console.log("Escrow deployed at:", address);
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

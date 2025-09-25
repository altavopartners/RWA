import { ethers } from "hardhat";

async function main() {
  const SplitPay = await ethers.getContractFactory("SplitPay");

  // Deploy
  const splitPay = await SplitPay.deploy();

  // Wait until it's mined
  await splitPay.waitForDeployment();

  // Get the address
  const addr = await splitPay.getAddress();

  // (Optional) Show the tx hash too
  const txHash = splitPay.deploymentTransaction()?.hash;

  console.log("SplitPay deployed to:", addr);
  if (txHash) console.log("Deployment tx:", txHash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

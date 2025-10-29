// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const Escrow = await ethers.getContractFactory("Escrow");

  // Replace with real buyer/seller addresses
  const buyer = "0xdbdaeF88839e18feF4E9C148b865bcC89dD44482";
  const seller = "0xdbdaeF88839e18feF4E9C148b865bcC89dD44482";
  const arbiter = deployer.address; // can also set a bank/platform account

  const totalAmount = ethers.parseUnits("1.0", "ether"); // 1 HBAR

  // Deploy contract with value sent to escrow
  const escrow = await Escrow.deploy(buyer, seller, arbiter, {
    value: totalAmount,
  });
  const receipt = await escrow.deploymentTransaction().wait();

  console.log("Transaction hash:", receipt.hash);
  console.log("Escrow deployed at:", escrow.target);

  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT=${escrow.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

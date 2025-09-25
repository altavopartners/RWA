import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const { PRIVATE_KEY, HEDERA_RPC } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hederaTestnet: {
      url: HEDERA_RPC || "https://testnet.hashio.io/api",
      chainId: 296,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
export default config;

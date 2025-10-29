require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [{ version: "0.8.20" }, { version: "0.8.28" }],
  },
  networks: {
    hederaTestnet: {
      url: process.env.HEDERA_TESTNET_RPC || "https://testnet.hashio.io/api",
      accounts: [process.env.HEDERA_PRIVATE_KEY].filter(Boolean),
    },
    hardhat: {},
  },
};

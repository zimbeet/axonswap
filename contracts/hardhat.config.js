require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 800,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 8210,
    },
    axon: {
      url: process.env.AXON_RPC_URL || "https://mainnet-rpc.axonchain.ai/",
      chainId: 8210,
      accounts:
        process.env.DEPLOYER_PRIVATE_KEY
          ? [process.env.DEPLOYER_PRIVATE_KEY]
          : [],
    },
  },
};

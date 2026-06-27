require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.35",
    settings: {
      optimizer: { enabled: false }
    }
  },
  networks: {
    arc: {
      url: "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};

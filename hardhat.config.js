require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

require("hardhat-gas-reporter");
module.exports = {
  gasReporter:{
    enabled: true,
    currency: "USD", 
    outputFile: "gas-report.txt",
    json: true  
  }
};
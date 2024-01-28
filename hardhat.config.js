require("@nomicfoundation/hardhat-toolbox");
const fs = require('fs');
require("dotenv").config();

const {
  SEPOLIA,
  PRIVATE_KEY
} = process.env

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      url: SEPOLIA,
      chainId: 11155111,
      accounts: [PRIVATE_KEY || '']
    }
  },
  solidity: "0.8.21",
};

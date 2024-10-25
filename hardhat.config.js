require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config();
require("@nomicfoundation/hardhat-verify");

const PRIVATEKEY = process.env.PRIVATEKEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.8.24",
      },
      {
        version: "0.8.27",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // 你可以根据需要调整这个值
      },
    },
  },
  paths: {
    sources: "./contracts", // 合约文件目录
    tests: "./test", // 测试文件目录
    cache: "./cache", // 缓存目录
    artifacts: "./artifacts", // 编译输出目录
  },
  defaultNetwork: "hardhat",
  networks: {
    snowtrace: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [PRIVATEKEY],
    },
  },
  etherscan: {
    apiKey: {
      snowtrace: "snowtrace", // apiKey is not required, just set a placeholder
    },
    customChains: [
      {
        network: "snowtrace",
        chainId: 43113,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://testnet.snowtrace.io",
        },
      },
    ],
  },
  mocha: {
    timeout: 20000,
  },
};

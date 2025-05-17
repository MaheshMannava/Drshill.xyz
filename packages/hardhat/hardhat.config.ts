import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox"; // Bundles ethers, typechain, solidity-coverage, hardhat-verify
import "hardhat-deploy"; // For deploy tasks and namedAccounts
import "dotenv/config";

// DEBUG: Check if PRIVATE_KEY is loaded
console.log("DEBUG: PRIVATE_KEY from .env:", process.env.PRIVATE_KEY ? "Loaded" : "NOT LOADED or EMPTY");
if (process.env.PRIVATE_KEY) {
  console.log("DEBUG: PRIVATE_KEY first few chars:", process.env.PRIVATE_KEY.substring(0, 5));
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "cornTestnet": {
      url: process.env.CORN_TESTNET_RPC_URL || "https://testnet-rpc.usecorn.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 21000001
    },
  },
  // etherscan config is part of HardhatUserConfig if hardhat-verify is loaded (via toolbox)
  etherscan: {
    apiKey: {
      "cornTestnet": process.env.CORN_ETHERSCAN_API_KEY || "corn"
    },
    customChains: [
      {
        network: "cornTestnet",
        chainId: 21000001,
        urls: {
          apiURL: "https://explorer-corn-testnet-l8rm17uloq.t.conduit.xyz/api",
          browserURL: "https://explorer-corn-testnet-l8rm17uloq.t.conduit.xyz"
        }
      }
    ]
  },
  // namedAccounts is from hardhat-deploy
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};

export default config;
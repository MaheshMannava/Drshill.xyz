import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
// import { Contract } from "ethers"; // We can get the contract instance if needed, but for deployment address is enough from deploy result

/**
 * Deploys the CropToken contract.
 * Mints 1,000,000 tokens to the deployer.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployCropToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Initial supply for CropToken (1 Million tokens with 18 decimals)
  const initialCropTokenSupply = hre.ethers.parseUnits("1000000", 18);

  // Deploy CropToken
  const cropTokenDeployment = await deploy("CropToken", {
    from: deployer,
    args: [initialCropTokenSupply], // Constructor argument: initialSupply
    log: true,
    autoMine: true,
  });

  console.log(`CropToken deployed at: ${cropTokenDeployment.address} with initial supply of ${hre.ethers.formatUnits(initialCropTokenSupply, 18)} CROP for deployer.`);
};

export default deployCropToken;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags CropContracts
deployCropToken.tags = ["CropTokenDeploy"];

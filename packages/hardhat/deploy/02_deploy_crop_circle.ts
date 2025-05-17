import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the CropCircle contract.
 * Uses the address of the previously deployed CropToken contract.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployCropCircle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get the deployed CropToken contract
  const cropTokenDeployment = await get("CropToken");

  // Deploy CropCircle
  const cropCircleDeployment = await deploy("CropCircle", {
    from: deployer,
    args: [cropTokenDeployment.address], // Constructor argument: _cropTokenAddress
    log: true,
    autoMine: true,
  });

  console.log(`CropCircle deployed at: ${cropCircleDeployment.address}, using CropToken at: ${cropTokenDeployment.address}`);
};

export default deployCropCircle;

deployCropCircle.tags = ["CropCircleDeploy"];
deployCropCircle.dependencies = ["CropTokenDeploy"]; // Depends on the CropToken deployment 
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "ethers"; // Import ethers for Contract type

/**
 * Transfers CROP tokens from the deployer to the CropCircle contract
 * for initial user distribution pool.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const fundCropCircle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { get } = hre.deployments;

  // Get the deployed CropToken and CropCircle contract deployments
  const cropTokenDeployment = await get("CropToken");
  const cropCircleDeployment = await get("CropCircle");

  // Get contract instances
  const cropToken = await hre.ethers.getContractAt("CropToken", cropTokenDeployment.address);
  const cropCircle = await hre.ethers.getContractAt("CropCircle", cropCircleDeployment.address);

  // Amount of CROP tokens to transfer (e.g., 100,000 tokens for 1000 users * 100 tokens/user)
  const amountToTransfer = hre.ethers.parseUnits("100000", 18);

  console.log(`Attempting to transfer ${hre.ethers.formatUnits(amountToTransfer, 18)} CROP from deployer (${deployer}) to CropCircle contract (${cropCircle.target})...`);

  // The deployer (owner of CropTokens) needs to approve the CropCircle contract to spend them
  console.log(`Approving CropCircle contract to spend ${hre.ethers.formatUnits(amountToTransfer, 18)} CROP on behalf of the deployer...`);
  const approveTx = await cropToken.connect(await hre.ethers.getSigner(deployer)).approve(cropCircle.target, amountToTransfer);
  await approveTx.wait(); // Wait for the approval transaction to be mined
  console.log(`Approval successful. Transaction hash: ${approveTx.hash}`);

  // Call the refillTokens function on the CropCircle contract
  console.log(`Calling refillTokens() on CropCircle contract...`);
  const refillTx = await cropCircle.connect(await hre.ethers.getSigner(deployer)).refillTokens(amountToTransfer);
  await refillTx.wait(); // Wait for the refill transaction to be mined
  console.log(`CropCircle contract funded successfully. Transaction hash: ${refillTx.hash}`);

  const cropCircleBalance = await cropToken.balanceOf(cropCircle.target);
  console.log(`CropCircle contract CROP token balance: ${hre.ethers.formatUnits(cropCircleBalance, 18)} CROP`);
};

export default fundCropCircle;

fundCropCircle.tags = ["FundCropCircle"];
fundCropCircle.dependencies = ["CropCircleDeploy"]; // Depends on the CropCircle deployment 
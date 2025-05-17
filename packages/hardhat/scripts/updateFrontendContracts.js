const fs = require('fs');
const path = require('path');

// Paths to relevant files
const cropTokenPath = path.join(__dirname, '../deployments/cornTestnet/CropToken.json');
const cropCirclePath = path.join(__dirname, '../deployments/cornTestnet/CropCircle.json');
const frontendDeployedContractsPath = path.join(__dirname, '../../nextjs/contracts/deployedContracts.ts');

// Read deployment files
try {
  const cropTokenDeployment = JSON.parse(fs.readFileSync(cropTokenPath, 'utf8'));
  const cropCircleDeployment = JSON.parse(fs.readFileSync(cropCirclePath, 'utf8'));
  
  // Read current deployedContracts.ts file
  let deployedContractsContent = fs.readFileSync(frontendDeployedContractsPath, 'utf8');
  
  // Parse the deployedContracts object from the file
  const deployedContractsMatch = deployedContractsContent.match(/const deployedContracts = ({[\s\S]*?});/);
  
  if (!deployedContractsMatch) {
    console.error('Could not find deployedContracts object in the file.');
    process.exit(1);
  }
  
  let deployedContracts;
  eval(`deployedContracts = ${deployedContractsMatch[1]}`);
  
  // Add Corn Testnet deployments (chain ID: 21000001)
  deployedContracts['21000001'] = {
    CropToken: {
      address: cropTokenDeployment.address,
      abi: cropTokenDeployment.abi
    },
    CropCircle: {
      address: cropCircleDeployment.address,
      abi: cropCircleDeployment.abi
    }
  };
  
  // Replace the deployedContracts object in the file
  const newDeployedContractsStr = JSON.stringify(deployedContracts, null, 2)
    .replace(/"([^"]+)":/g, '$1:'); // Convert "key": to key: for TypeScript format
  
  deployedContractsContent = deployedContractsContent.replace(
    /const deployedContracts = ({[\s\S]*?});/,
    `const deployedContracts = ${newDeployedContractsStr};`
  );
  
  // Write updated content back to the file
  fs.writeFileSync(frontendDeployedContractsPath, deployedContractsContent);
  
  console.log('✅ Frontend contracts updated successfully with Corn Testnet deployments!');
  console.log(`📋 CropToken: ${cropTokenDeployment.address}`);
  console.log(`📋 CropCircle: ${cropCircleDeployment.address}`);
} catch (error) {
  console.error('Error updating frontend contracts:', error);
  process.exit(1);
} 
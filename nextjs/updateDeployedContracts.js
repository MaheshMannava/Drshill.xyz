const fs = require('fs');
const path = require('path');

// Define the path to the deployedContracts.ts file
const deployedContractsPath = path.join(__dirname, 'contracts', 'deployedContracts.ts');

try {
  // Read the contracts from the Hardhat deployments
  const cropTokenDeployment = {
    address: '0xdcD05f8a029F0A7998fDF29f0e9AE6a97541e370',
    abi: JSON.parse(fs.readFileSync(path.join(__dirname, '../hardhat/deployments/cornTestnet/CropToken.json'), 'utf8')).abi
  };
  
  const cropCircleDeployment = {
    address: '0x8b9Fa5293f2Bec34bB5eE382eb291eAfE81AF85b',
    abi: JSON.parse(fs.readFileSync(path.join(__dirname, '../hardhat/deployments/cornTestnet/CropCircle.json'), 'utf8')).abi
  };

  // Read the existing deployedContracts.ts file
  let content = fs.readFileSync(deployedContractsPath, 'utf8');
  
  // Create the Corn Testnet entry (21000001)
  const cornTestnetEntry = {
    CropToken: cropTokenDeployment,
    CropCircle: cropCircleDeployment
  };
  
  // Convert to string with proper formatting for TS
  const cornTestnetEntryStr = JSON.stringify(cornTestnetEntry, null, 2)
    .replace(/"([^"]+)":/g, '$1:');
  
  // Insert the entry before the closing brace
  const modifiedContent = content.replace(
    /\} as const;/,
    `  21000001: ${cornTestnetEntryStr},\n} as const;`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(deployedContractsPath, modifiedContent);
  
  console.log('✅ Corn Testnet contracts added to deployedContracts.ts');
  console.log('📋 CropToken: 0xdcD05f8a029F0A7998fDF29f0e9AE6a97541e370');
  console.log('📋 CropCircle: 0x8b9Fa5293f2Bec34bB5eE382eb291eAfE81AF85b');
} catch (error) {
  console.error('Error updating deployedContracts.ts:', error);
  process.exit(1);
} 
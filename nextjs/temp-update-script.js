const fs = require('fs');
const path = require('path');

// Define file paths 
const deployedContractsPath = path.join('contracts', 'deployedContracts.ts');
const cropTokenPath = path.join('..', 'hardhat', 'deployments', 'cornTestnet', 'CropToken.json');
const cropCirclePath = path.join('..', 'hardhat', 'deployments', 'cornTestnet', 'CropCircle.json');

// Create Corn Testnet entry with just the addresses (keeping it simple)
const cornTestnetEntry = {
  CropToken: { 
    address: '0xdcD05f8a029F0A7998fDF29f0e9AE6a97541e370'
  },
  CropCircle: { 
    address: '0x8b9Fa5293f2Bec34bB5eE382eb291eAfE81AF85b'
  }
};

try {
  // Read file
  let content = fs.readFileSync(deployedContractsPath, 'utf8');
  console.log('Original file read, size:', content.length);

  // Replace using a simpler approach
  const lastIndex = content.lastIndexOf('} as const;');
  if (lastIndex !== -1) {
    const beforePart = content.substring(0, lastIndex);
    const afterPart = content.substring(lastIndex);
    
    // Insert entry
    const newContent = beforePart + 
      '  21000001: ' +
      JSON.stringify(cornTestnetEntry, null, 2)
        .replace(/\"([^\"]+)\":/g, '$1:') +
      ',\n' + 
      afterPart;
    
    // Write file
    fs.writeFileSync(deployedContractsPath, newContent);
    console.log('✅ Corn Testnet entries added successfully');
  } else {
    console.error('Could not find closing brace in deployedContracts.ts');
  }
} catch (error) {
  console.error('Error updating file:', error);
} 
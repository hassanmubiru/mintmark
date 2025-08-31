const { ethers, run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Starting contract verification on", network.name);

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found:", deploymentFile);
    console.log("Please run deployment first:");
    console.log(`npx hardhat run scripts/deploy.js --network ${network.name}`);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contracts = deploymentInfo.contracts;

  console.log("📄 Loaded deployment info:");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);

  // Helper function to verify a contract
  async function verifyContract(contractName, address, constructorArguments = []) {
    console.log(`\n🔍 Verifying ${contractName} at ${address}...`);
    
    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: constructorArguments,
      });
      
      console.log(`✅ ${contractName} verified successfully`);
      contracts[contractName].verified = true;
      return true;
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log(`✅ ${contractName} is already verified`);
        contracts[contractName].verified = true;
        return true;
      } else {
        console.error(`❌ Failed to verify ${contractName}:`, error.message);
        contracts[contractName].verified = false;
        contracts[contractName].verificationError = error.message;
        return false;
      }
    }
  }

  // Verify contracts in deployment order
  const verificationResults = [];

  // 1. Verify AccessControl (no constructor arguments)
  const accessControlResult = await verifyContract(
    "AccessControl",
    contracts.AccessControl.address,
    []
  );
  verificationResults.push({ name: "AccessControl", success: accessControlResult });

  // Wait a bit between verifications to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 2. Verify EventManager (accessControl address)
  const eventManagerResult = await verifyContract(
    "EventManager",
    contracts.EventManager.address,
    [contracts.AccessControl.address]
  );
  verificationResults.push({ name: "EventManager", success: eventManagerResult });

  await new Promise(resolve => setTimeout(resolve, 5000));

  // 3. Verify BadgeNFT (accessControl, eventManager addresses)
  const badgeNFTResult = await verifyContract(
    "BadgeNFT",
    contracts.BadgeNFT.address,
    [contracts.AccessControl.address, contracts.EventManager.address]
  );
  verificationResults.push({ name: "BadgeNFT", success: badgeNFTResult });

  await new Promise(resolve => setTimeout(resolve, 5000));

  // 4. Verify Attendance (accessControl, eventManager, badgeNFT addresses)
  const attendanceResult = await verifyContract(
    "Attendance",
    contracts.Attendance.address,
    [
      contracts.AccessControl.address,
      contracts.EventManager.address,
      contracts.BadgeNFT.address
    ]
  );
  verificationResults.push({ name: "Attendance", success: attendanceResult });

  // Update deployment info with verification status
  deploymentInfo.verificationCompleted = new Date().toISOString();
  deploymentInfo.verificationResults = verificationResults;

  // Save updated deployment info
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  // Print summary
  console.log("\n📊 Verification Summary:");
  console.log("=".repeat(50));
  
  let successCount = 0;
  verificationResults.forEach(result => {
    const status = result.success ? "✅ VERIFIED" : "❌ FAILED";
    console.log(`${result.name}: ${status}`);
    if (result.success) successCount++;
  });

  console.log(`\n📈 Verification completed: ${successCount}/${verificationResults.length} contracts verified`);

  if (successCount === verificationResults.length) {
    console.log("🎉 All contracts verified successfully!");
    
    // Generate block explorer links
    const baseUrl = getBlockExplorerUrl(network.name);
    if (baseUrl) {
      console.log("\n🔗 Block Explorer Links:");
      Object.entries(contracts).forEach(([name, info]) => {
        console.log(`${name}: ${baseUrl}/address/${info.address}`);
      });
    }
  } else {
    console.log("⚠️  Some contracts failed verification. Check the logs above for details.");
  }

  // Show frontend integration info
  console.log("\n🔧 Frontend Integration:");
  console.log("Add these to your .env file:");
  console.log(`NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS=${contracts.AccessControl.address}`);
  console.log(`NEXT_PUBLIC_EVENT_MANAGER_ADDRESS=${contracts.EventManager.address}`);
  console.log(`NEXT_PUBLIC_BADGE_NFT_ADDRESS=${contracts.BadgeNFT.address}`);
  console.log(`NEXT_PUBLIC_ATTENDANCE_ADDRESS=${contracts.Attendance.address}`);
}

function getBlockExplorerUrl(networkName) {
  const explorerUrls = {
    "base": "https://basescan.org",
    "base-goerli": "https://goerli.basescan.org",
    "base-sepolia": "https://sepolia.basescan.org",
  };
  
  return explorerUrls[networkName] || null;
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });

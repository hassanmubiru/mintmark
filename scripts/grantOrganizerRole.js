const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🎯 Granting organizer role...");

  // Get the wallet address from command line arguments
  const walletAddress = process.argv[2];
  
  if (!walletAddress) {
    console.error("❌ Please provide a wallet address as an argument");
    console.log("Usage: npx hardhat run scripts/grantOrganizerRole.js --network <network> <wallet_address>");
    process.exit(1);
  }

  // Validate address format
  if (!ethers.isAddress(walletAddress)) {
    console.error("❌ Invalid wallet address format");
    process.exit(1);
  }

  // Load deployment info
  const network = hre.network.name;
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found:", deploymentFile);
    console.log("Please run deployment first:");
    console.log(`npx hardhat run scripts/deploy.js --network ${network}`);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const accessControlAddress = deploymentInfo.contracts.AccessControl.address;

  console.log(`📋 Granting organizer role on ${network} network`);
  console.log(`🔗 AccessControl contract: ${accessControlAddress}`);
  console.log(`👤 Target wallet: ${walletAddress}`);

  // Get signer (must be admin)
  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Using signer: ${deployer.address}`);

  // Get contract instance
  const accessControl = await ethers.getContractAt("MintMarkAccessControl", accessControlAddress);

  try {
    // Check if signer is admin
    const isSignerAdmin = await accessControl.isAdmin(deployer.address);
    if (!isSignerAdmin) {
      console.error("❌ Error: Signer is not an admin");
      console.log("Only admins can grant organizer roles");
      process.exit(1);
    }

    // Check if target already has organizer role
    const isAlreadyOrganizer = await accessControl.isOrganizer(walletAddress);
    if (isAlreadyOrganizer) {
      console.log("⚠️  Address already has organizer role");
      process.exit(0);
    }

    // Grant organizer role
    console.log("\n🚀 Granting organizer role...");
    const tx = await accessControl.addOrganizer(walletAddress);
    console.log(`📝 Transaction hash: ${tx.hash}`);
    
    console.log("⏳ Waiting for confirmation...");
    await tx.wait();
    
    console.log("✅ Organizer role granted successfully!");
    console.log(`🎯 ${walletAddress} can now access the organizer dashboard`);

  } catch (error) {
    console.error("❌ Error granting organizer role:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

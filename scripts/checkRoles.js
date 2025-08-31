const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Checking roles for wallet address...");

  // Get the wallet address from command line arguments
  const walletAddress = process.argv[2];
  
  if (!walletAddress) {
    console.error("❌ Please provide a wallet address as an argument");
    console.log("Usage: npx hardhat run scripts/checkRoles.js --network <network> <wallet_address>");
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

  console.log(`📋 Checking roles on ${network} network`);
  console.log(`🔗 AccessControl contract: ${accessControlAddress}`);
  console.log(`👤 Wallet address: ${walletAddress}`);

  // Get contract instance
  const accessControl = await ethers.getContractAt("MintMarkAccessControl", accessControlAddress);

  try {
    // Check roles
    const [isAdmin, isOrganizer, isVerifier] = await Promise.all([
      accessControl.isAdmin(walletAddress),
      accessControl.isOrganizer(walletAddress),
      accessControl.isVerifier(walletAddress)
    ]);

    console.log("\n📊 Role Status:");
    console.log("=".repeat(40));
    console.log(`👑 Admin: ${isAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`🎯 Organizer: ${isOrganizer ? '✅ Yes' : '❌ No'}`);
    console.log(`🔍 Verifier: ${isVerifier ? '✅ Yes' : '❌ No'}`);

    if (!isAdmin && !isOrganizer && !isVerifier) {
      console.log("\n⚠️  No roles found for this address");
      console.log("To access organizer features, you need to be granted the organizer role by an admin.");
    } else if (isOrganizer) {
      console.log("\n✅ You have organizer access! You should be able to login to the organizer dashboard.");
    } else if (isAdmin) {
      console.log("\n✅ You have admin access! You can grant organizer roles to other addresses.");
    }

  } catch (error) {
    console.error("❌ Error checking roles:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

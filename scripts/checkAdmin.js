const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Checking admin roles...");

  // Load deployment info
  const network = hre.network.name;
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found:", deploymentFile);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const accessControlAddress = deploymentInfo.contracts.AccessControl.address;
  const adminAddress = deploymentInfo.deployer;

  console.log(`📋 Checking roles on ${network} network`);
  console.log(`🔗 AccessControl contract: ${accessControlAddress}`);
  console.log(`👤 Admin address: ${adminAddress}`);

  // Get contract instance
  const accessControl = await ethers.getContractAt("MintMarkAccessControl", accessControlAddress);

  try {
    // Check roles for the deployer (admin)
    const [isAdmin, isOrganizer, isVerifier] = await Promise.all([
      accessControl.isAdmin(adminAddress),
      accessControl.isOrganizer(adminAddress),
      accessControl.isVerifier(adminAddress)
    ]);

    console.log("\n📊 Role Status for Deployer:");
    console.log("=".repeat(40));
    console.log(`👑 Admin: ${isAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`🎯 Organizer: ${isOrganizer ? '✅ Yes' : '❌ No'}`);
    console.log(`🔍 Verifier: ${isVerifier ? '✅ Yes' : '❌ No'}`);

    if (!isAdmin) {
      console.log("\n⚠️  Deployer is not an admin! This is a problem.");
      console.log("Let's check if we need to grant admin role...");
      
      // Check if the contract has the DEFAULT_ADMIN_ROLE
      const defaultAdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const hasDefaultAdminRole = await accessControl.hasRole(defaultAdminRole, adminAddress);
      console.log(`🔑 Has DEFAULT_ADMIN_ROLE: ${hasDefaultAdminRole ? '✅ Yes' : '❌ No'}`);
      
      if (!hasDefaultAdminRole) {
        console.log("\n❌ The deployer doesn't have the DEFAULT_ADMIN_ROLE either!");
        console.log("This suggests the contract deployment may have failed or the role wasn't set correctly.");
      }
    } else {
      console.log("\n✅ Deployer has admin access! The issue might be in the frontend.");
    }

  } catch (error) {
    console.error("❌ Error checking roles:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

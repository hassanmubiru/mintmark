const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting MintMark deployment on", network.name);
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy AccessControl first
  console.log("\n📋 Deploying AccessControl...");
  const AccessControl = await ethers.getContractFactory("MintMarkAccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("✅ AccessControl deployed to:", accessControlAddress);

  // Deploy EventManager
  console.log("\n📅 Deploying EventManager...");
  const EventManager = await ethers.getContractFactory("EventManager");
  const eventManager = await EventManager.deploy(accessControlAddress);
  await eventManager.waitForDeployment();
  const eventManagerAddress = await eventManager.getAddress();
  console.log("✅ EventManager deployed to:", eventManagerAddress);

  // Deploy BadgeNFT
  console.log("\n🏆 Deploying BadgeNFT...");
  const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
  const badgeNFT = await BadgeNFT.deploy(accessControlAddress, eventManagerAddress);
  await badgeNFT.waitForDeployment();
  const badgeNFTAddress = await badgeNFT.getAddress();
  console.log("✅ BadgeNFT deployed to:", badgeNFTAddress);

  // Deploy Attendance
  console.log("\n✅ Deploying Attendance...");
  const Attendance = await ethers.getContractFactory("Attendance");
  const attendance = await Attendance.deploy(
    accessControlAddress,
    eventManagerAddress,
    badgeNFTAddress
  );
  await attendance.waitForDeployment();
  const attendanceAddress = await attendance.getAddress();
  console.log("✅ Attendance deployed to:", attendanceAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AccessControl: {
        address: accessControlAddress,
        verified: false
      },
      EventManager: {
        address: eventManagerAddress,
        verified: false
      },
      BadgeNFT: {
        address: badgeNFTAddress,
        verified: false
      },
      Attendance: {
        address: attendanceAddress,
        verified: false
      }
    },
    gasUsed: {
      // Will be filled in during verification
    }
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`AccessControl: ${accessControlAddress}`);
  console.log(`EventManager: ${eventManagerAddress}`);
  console.log(`BadgeNFT: ${badgeNFTAddress}`);
  console.log(`Attendance: ${attendanceAddress}`);
  console.log(`Deployment info saved to: ${deploymentFile}`);

  // Set up initial roles and permissions
  console.log("\n🔐 Setting up initial permissions...");
  
  // Grant deployer organizer role for testing
  try {
    const tx = await accessControl.addOrganizer(deployer.address);
    await tx.wait();
    console.log("✅ Added deployer as organizer");
  } catch (error) {
    console.log("⚠️  Deployer already has organizer role or error occurred:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Verify contracts on block explorer:");
  console.log(`   npx hardhat run scripts/verify.js --network ${network.name}`);
  console.log("2. Update frontend environment variables with contract addresses");
  console.log("3. Test the deployment with sample events:");
  console.log(`   npx hardhat run scripts/seedEvents.js --network ${network.name}`);

  // Create environment variables for frontend
  console.log("\n🔧 Environment variables for frontend:");
  console.log(`NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS=${accessControlAddress}`);
  console.log(`NEXT_PUBLIC_EVENT_MANAGER_ADDRESS=${eventManagerAddress}`);
  console.log(`NEXT_PUBLIC_BADGE_NFT_ADDRESS=${badgeNFTAddress}`);
  console.log(`NEXT_PUBLIC_ATTENDANCE_ADDRESS=${attendanceAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=${network.config.chainId}`);

  return {
    accessControl: accessControlAddress,
    eventManager: eventManagerAddress,
    badgeNFT: badgeNFTAddress,
    attendance: attendanceAddress
  };
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

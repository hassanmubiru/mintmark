const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌱 Seeding sample events on", network.name);

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

  const [deployer] = await ethers.getSigners();
  console.log("📝 Seeding with account:", deployer.address);

  // Get contract instances
  const accessControl = await ethers.getContractAt("MintMarkAccessControl", contracts.AccessControl.address);
  const eventManager = await ethers.getContractAt("EventManager", contracts.EventManager.address);
  const badgeNFT = await ethers.getContractAt("BadgeNFT", contracts.BadgeNFT.address);
  const attendance = await ethers.getContractAt("Attendance", contracts.Attendance.address);

  // Check if deployer has organizer role
  const hasOrganizerRole = await accessControl.isOrganizer(deployer.address);
  if (!hasOrganizerRole) {
    console.log("⚠️  Adding deployer as organizer...");
    const tx = await accessControl.addOrganizer(deployer.address);
    await tx.wait();
    console.log("✅ Added deployer as organizer");
  }

  // Sample events data
  const sampleEvents = [
    {
      title: "Web3 Developer Meetup",
      description: "Join us for an evening of blockchain development discussions, networking, and learning about the latest in Web3 technology.",
      location: "Tech Hub, 123 Blockchain St, Crypto City",
      category: "Technology",
      maxAttendees: 50,
      durationHours: 3
    },
    {
      title: "DeFi Workshop Series",
      description: "Hands-on workshop covering DeFi protocols, yield farming, and smart contract security best practices.",
      location: "Online via Zoom",
      category: "Education",
      maxAttendees: 100,
      durationHours: 4
    },
    {
      title: "NFT Art Gallery Opening",
      description: "Experience the latest in digital art with live minting opportunities and artist meet & greets.",
      location: "Digital Arts Center, 456 NFT Avenue",
      category: "Art",
      maxAttendees: 75,
      durationHours: 6
    },
    {
      title: "Blockchain Gaming Tournament",
      description: "Compete in the ultimate blockchain gaming championship with prizes in cryptocurrency and NFTs.",
      location: "Gaming Arena, 789 Play Street",
      category: "Gaming",
      maxAttendees: 200,
      durationHours: 8
    },
    {
      title: "Crypto Investment Seminar",
      description: "Learn about cryptocurrency investment strategies, portfolio management, and market analysis from industry experts.",
      location: "Finance Center, 321 Investment Blvd",
      category: "Finance",
      maxAttendees: 40,
      durationHours: 2
    }
  ];

  console.log(`\n📅 Creating ${sampleEvents.length} sample events...`);

  const createdEvents = [];

  for (let i = 0; i < sampleEvents.length; i++) {
    const event = sampleEvents[i];
    
    // Calculate timestamps (events start 1-30 days from now)
    const startTime = Math.floor(Date.now() / 1000) + (86400 * (i + 1)); // 1, 2, 3... days from now
    const endTime = startTime + (event.durationHours * 3600); // duration in seconds

    // Create metadata URI (in a real app, this would be uploaded to IPFS)
    const metadataURI = `https://api.mintmark.app/metadata/event-${i + 1}.json`;

    try {
      console.log(`\n📝 Creating event ${i + 1}: ${event.title}`);
      
      const tx = await eventManager.createEvent(
        event.title,
        event.description,
        metadataURI,
        startTime,
        endTime,
        event.maxAttendees,
        event.location,
        event.category
      );

      const receipt = await tx.wait();
      
      // Find the EventCreated event in the transaction logs
      const eventCreatedLog = receipt.logs.find(log => {
        try {
          const parsed = eventManager.interface.parseLog(log);
          return parsed.name === "EventCreated";
        } catch (e) {
          return false;
        }
      });

      if (eventCreatedLog) {
        const parsedLog = eventManager.interface.parseLog(eventCreatedLog);
        const eventId = parsedLog.args.eventId.toString();
        
        createdEvents.push({
          id: eventId,
          title: event.title,
          startTime: new Date(startTime * 1000).toISOString(),
          endTime: new Date(endTime * 1000).toISOString(),
          category: event.category,
          maxAttendees: event.maxAttendees
        });

        console.log(`✅ Event created with ID: ${eventId}`);
      }

    } catch (error) {
      console.error(`❌ Failed to create event ${i + 1}:`, error.message);
    }

    // Wait a bit between transactions
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Create sample QR codes for the first few events
  console.log("\n🔐 Generating QR codes for events...");
  
  for (let i = 0; i < Math.min(3, createdEvents.length); i++) {
    const eventId = createdEvents[i].id;
    const qrSecret = `mintmark-event-${eventId}-${Date.now()}`;
    const expiryDuration = 86400 * 7; // 7 days

    try {
      const tx = await attendance.generateQRCode(eventId, qrSecret, expiryDuration);
      await tx.wait();
      console.log(`✅ QR code generated for event ${eventId}: ${qrSecret.substring(0, 20)}...`);
    } catch (error) {
      console.error(`❌ Failed to generate QR code for event ${eventId}:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Save seeding info
  const seedingInfo = {
    network: network.name,
    seededAt: new Date().toISOString(),
    seededBy: deployer.address,
    events: createdEvents,
    totalEvents: createdEvents.length
  };

  const seedingFile = path.join(__dirname, "..", "deployments", `${network.name}-seeding.json`);
  fs.writeFileSync(seedingFile, JSON.stringify(seedingInfo, null, 2));

  console.log("\n📊 Seeding Summary:");
  console.log("=".repeat(50));
  console.log(`Network: ${network.name}`);
  console.log(`Events created: ${createdEvents.length}/${sampleEvents.length}`);
  console.log(`Seeded by: ${deployer.address}`);
  console.log(`Data saved to: ${seedingFile}`);

  if (createdEvents.length > 0) {
    console.log("\n📅 Created Events:");
    createdEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (ID: ${event.id})`);
      console.log(`   Category: ${event.category}, Max Attendees: ${event.maxAttendees}`);
      console.log(`   Start: ${event.startTime}`);
    });

    console.log("\n🎯 Next Steps:");
    console.log("1. Use the frontend to view and interact with these events");
    console.log("2. Test attendance verification using the generated QR codes");
    console.log("3. Mint badges for test attendees");
    console.log("\n🔗 Contract Addresses:");
    console.log(`EventManager: ${contracts.EventManager.address}`);
    console.log(`BadgeNFT: ${contracts.BadgeNFT.address}`);
    console.log(`Attendance: ${contracts.Attendance.address}`);
  }

  console.log("\n🎉 Seeding completed!");
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });

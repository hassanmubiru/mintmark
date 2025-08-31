const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Attendance", function () {
  let accessControl, eventManager, badgeNFT, attendance;
  let owner, organizer, verifier, user1, user2;
  
  async function deployFixture() {
    [owner, organizer, verifier, user1, user2] = await ethers.getSigners();
    
    // Deploy AccessControl
    const AccessControl = await ethers.getContractFactory("MintMarkAccessControl");
    accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
    
    // Add roles
    await accessControl.addOrganizer(organizer.address);
    await accessControl.addVerifier(verifier.address);
    
    // Deploy EventManager
    const EventManager = await ethers.getContractFactory("EventManager");
    eventManager = await EventManager.deploy(await accessControl.getAddress());
    await eventManager.waitForDeployment();
    
    // Deploy BadgeNFT
    const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    badgeNFT = await BadgeNFT.deploy(
      await accessControl.getAddress(),
      await eventManager.getAddress()
    );
    await badgeNFT.waitForDeployment();
    
    // Deploy Attendance
    const Attendance = await ethers.getContractFactory("Attendance");
    attendance = await Attendance.deploy(
      await accessControl.getAddress(),
      await eventManager.getAddress(),
      await badgeNFT.getAddress()
    );
    await attendance.waitForDeployment();
    
    // Create a test event
    const now = await time.latest();
    const startTime = now - 1000; // Event started
    const endTime = now + 3600; // Event ends in 1 hour
    
    await eventManager.connect(organizer).createEvent(
      "Test Event",
      "Test Description",
      "ipfs://test-metadata",
      startTime,
      endTime,
      100,
      "Test Location",
      "Technology"
    );
    
    return { 
      accessControl, 
      eventManager, 
      badgeNFT, 
      attendance, 
      owner, 
      organizer, 
      verifier, 
      user1, 
      user2 
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct contract addresses", async function () {
      const { attendance, accessControl, eventManager, badgeNFT } = await loadFixture(deployFixture);
      
      expect(await attendance.accessControl()).to.equal(await accessControl.getAddress());
      expect(await attendance.eventManager()).to.equal(await eventManager.getAddress());
      expect(await attendance.badgeNFT()).to.equal(await badgeNFT.getAddress());
    });

    it("Should reject zero addresses", async function () {
      const Attendance = await ethers.getContractFactory("Attendance");
      
      await expect(Attendance.deploy(
        ethers.ZeroAddress,
        await eventManager.getAddress(),
        await badgeNFT.getAddress()
      )).to.be.revertedWith("Invalid access control address");
    });
  });

  describe("QR Code Verification", function () {
    it("Should allow verifier to generate QR code", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const secret = "test-secret-123";
      const expiryDuration = 3600; // 1 hour
      
      await expect(attendance.connect(organizer).generateQRCode(1, secret, expiryDuration))
        .to.emit(attendance, "QRCodeGenerated");
      
      expect(await attendance.isQRCodeValid(1)).to.be.true;
    });

    it("Should allow user to verify attendance with QR code", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const secret = "test-secret-123";
      const expiryDuration = 3600;
      
      // Generate QR code
      await attendance.connect(organizer).generateQRCode(1, secret, expiryDuration);
      
      // Verify attendance
      await expect(attendance.connect(user1).verifyAttendanceByQR(
        1,
        secret,
        "ipfs://badge-metadata"
      )).to.emit(attendance, "AttendanceVerified")
        .withArgs(user1.address, 1, 1, user1.address); // Method 1 = QR_CODE
      
      // Check attendance record
      const record = await attendance.getAttendanceRecord(1, user1.address);
      expect(record.attendee).to.equal(user1.address);
      expect(record.eventId).to.equal(1);
      expect(record.method).to.equal(1); // QR_CODE
    });

    it("Should reject invalid QR secret", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const secret = "test-secret-123";
      const wrongSecret = "wrong-secret";
      const expiryDuration = 3600;
      
      await attendance.connect(organizer).generateQRCode(1, secret, expiryDuration);
      
      await expect(attendance.connect(user1).verifyAttendanceByQR(
        1,
        wrongSecret,
        "ipfs://badge-metadata"
      )).to.be.revertedWith("Invalid QR code secret");
    });

    it("Should reject expired QR code", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const secret = "test-secret-123";
      const shortExpiry = 1; // 1 second
      
      await attendance.connect(organizer).generateQRCode(1, secret, shortExpiry);
      
      // Wait for expiry
      await time.increase(2);
      
      await expect(attendance.connect(user1).verifyAttendanceByQR(
        1,
        secret,
        "ipfs://badge-metadata"
      )).to.be.revertedWith("QR code expired");
    });

    it("Should reject duplicate QR verification", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const secret = "test-secret-123";
      const expiryDuration = 3600;
      
      await attendance.connect(organizer).generateQRCode(1, secret, expiryDuration);
      
      // First verification should succeed
      await attendance.connect(user1).verifyAttendanceByQR(
        1,
        secret,
        "ipfs://badge-metadata"
      );
      
      // Second verification should fail
      await expect(attendance.connect(user2).verifyAttendanceByQR(
        1,
        secret,
        "ipfs://badge-metadata-2"
      )).to.be.revertedWith("QR code already used");
    });
  });

  describe("Manual Verification", function () {
    it("Should allow verifier to manually verify attendance", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      await expect(attendance.connect(verifier).verifyAttendanceManually(
        user1.address,
        1,
        "Manual verification notes",
        "ipfs://badge-metadata"
      )).to.emit(attendance, "AttendanceVerified")
        .withArgs(user1.address, 1, 2, verifier.address); // Method 2 = MANUAL
      
      const record = await attendance.getAttendanceRecord(1, user1.address);
      expect(record.method).to.equal(2); // MANUAL
      expect(record.verifiedBy).to.equal(verifier.address);
    });

    it("Should allow organizer to manually verify attendance", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      await expect(attendance.connect(organizer).verifyAttendanceManually(
        user1.address,
        1,
        "Organizer verification",
        "ipfs://badge-metadata"
      )).to.emit(attendance, "AttendanceVerified");
    });

    it("Should reject unauthorized manual verification", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      await expect(attendance.connect(user1).verifyAttendanceManually(
        user2.address,
        1,
        "Unauthorized verification",
        "ipfs://badge-metadata"
      )).to.be.revertedWith("Not authorized: requires verifier, organizer, or admin role");
    });

    it("Should reject manual verification for invalid address", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      await expect(attendance.connect(verifier).verifyAttendanceManually(
        ethers.ZeroAddress,
        1,
        "Manual verification notes",
        "ipfs://badge-metadata"
      )).to.be.revertedWith("Invalid attendee address");
    });
  });

  describe("Signature Verification", function () {
    it("Should verify attendance with valid signature", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      // Create a message hash and sign it with organizer
      const eventId = 1;
      const attendeeAddress = user1.address;
      const timestamp = await time.latest();
      
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint256"],
        [eventId, attendeeAddress, timestamp]
      );
      
      const signature = await organizer.signMessage(ethers.getBytes(messageHash));
      
      await expect(attendance.connect(user1).verifyAttendanceBySignature(
        eventId,
        signature,
        "ipfs://badge-metadata"
      )).to.emit(attendance, "AttendanceVerified")
        .withArgs(user1.address, 1, 0, organizer.address); // Method 0 = SIGNATURE
    });

    it("Should reject invalid signature", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const invalidSignature = "0x" + "00".repeat(65); // Invalid signature
      
      await expect(attendance.connect(user1).verifyAttendanceBySignature(
        1,
        invalidSignature,
        "ipfs://badge-metadata"
      )).to.be.revertedWith("Invalid signature: not from authorized verifier");
    });
  });

  describe("Duplicate Attendance Prevention", function () {
    it("Should prevent duplicate attendance verification", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      // First verification
      await attendance.connect(verifier).verifyAttendanceManually(
        user1.address,
        1,
        "First verification",
        "ipfs://badge-metadata"
      );
      
      // Second verification should fail
      await expect(attendance.connect(verifier).verifyAttendanceManually(
        user1.address,
        1,
        "Second verification",
        "ipfs://badge-metadata-2"
      )).to.be.revertedWith("Already verified attendance");
    });
  });

  describe("Batch Verification", function () {
    it("Should allow batch verification of multiple attendees", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const attendees = [user1.address, user2.address];
      const metadataURIs = ["ipfs://badge-metadata-1", "ipfs://badge-metadata-2"];
      
      await attendance.connect(verifier).batchVerifyAttendance(
        attendees,
        1,
        metadataURIs,
        "Batch verification"
      );
      
      // Check both attendees are verified
      expect(await attendance.getAttendanceRecord(1, user1.address)).to.exist;
      expect(await attendance.getAttendanceRecord(1, user2.address)).to.exist;
    });

    it("Should reject batch verification with mismatched arrays", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const attendees = [user1.address, user2.address];
      const metadataURIs = ["ipfs://badge-metadata-1"]; // Only one URI
      
      await expect(attendance.connect(verifier).batchVerifyAttendance(
        attendees,
        1,
        metadataURIs,
        "Batch verification"
      )).to.be.revertedWith("Arrays length mismatch");
    });
  });

  describe("Attendance Revocation", function () {
    it("Should allow organizer to revoke attendance", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      // First verify attendance
      await attendance.connect(verifier).verifyAttendanceManually(
        user1.address,
        1,
        "Manual verification",
        "ipfs://badge-metadata"
      );
      
      // Then revoke it
      await expect(attendance.connect(organizer).revokeAttendance(
        user1.address,
        1,
        "Fraudulent attendance"
      )).to.emit(attendance, "AttendanceRevoked")
        .withArgs(user1.address, 1, organizer.address, "Fraudulent attendance");
    });

    it("Should reject revocation of non-existent attendance", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      await expect(attendance.connect(organizer).revokeAttendance(
        user1.address,
        1,
        "Non-existent attendance"
      )).to.be.revertedWith("Attendance not recorded");
    });
  });

  describe("Event Capacity Management", function () {
    it("Should respect event capacity limits", async function () {
      const { attendance, eventManager } = await loadFixture(deployFixture);
      
      // Create event with capacity of 1
      const now = await time.latest();
      await eventManager.connect(organizer).createEvent(
        "Limited Event",
        "Test Description",
        "ipfs://test-metadata-2",
        now - 1000,
        now + 3600,
        1, // Max 1 attendee
        "Test Location",
        "Technology"
      );
      
      // First verification should succeed
      await attendance.connect(verifier).verifyAttendanceManually(
        user1.address,
        2, // Event ID 2
        "First attendee",
        "ipfs://badge-metadata-1"
      );
      
      // Second verification should fail due to capacity
      await expect(attendance.connect(verifier).verifyAttendanceManually(
        user2.address,
        2,
        "Second attendee",
        "ipfs://badge-metadata-2"
      )).to.be.revertedWith("Event is at maximum capacity");
    });
  });

  describe("Inactive Event Handling", function () {
    it("Should reject verification for inactive events", async function () {
      const { attendance, eventManager } = await loadFixture(deployFixture);
      
      // Deactivate the event
      await eventManager.connect(organizer).deactivateEvent(1, "Event cancelled");
      
      await expect(attendance.connect(verifier).verifyAttendanceManually(
        user1.address,
        1,
        "Manual verification",
        "ipfs://badge-metadata"
      )).to.be.revertedWith("Event is not currently active");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      // Verify some attendances for testing
      await attendance.connect(verifier).verifyAttendanceManually(
        user1.address,
        1,
        "User 1 verification",
        "ipfs://badge-metadata-1"
      );
      
      await attendance.connect(verifier).verifyAttendanceManually(
        user2.address,
        1,
        "User 2 verification",
        "ipfs://badge-metadata-2"
      );
    });

    it("Should return correct attendee list", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const attendees = await attendance.getEventAttendees(1);
      expect(attendees).to.have.length(2);
      expect(attendees).to.include(user1.address);
      expect(attendees).to.include(user2.address);
    });

    it("Should return correct attendance count", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      const count = await attendance.getAttendanceCount(1);
      expect(count).to.equal(2);
    });

    it("Should return empty list for events with no attendees", async function () {
      const { attendance, eventManager } = await loadFixture(deployFixture);
      
      // Create new event with no attendees
      const now = await time.latest();
      await eventManager.connect(organizer).createEvent(
        "Empty Event",
        "Test Description",
        "ipfs://test-metadata-3",
        now - 1000,
        now + 3600,
        100,
        "Test Location",
        "Technology"
      );
      
      const attendees = await attendance.getEventAttendees(2);
      expect(attendees).to.have.length(0);
    });
  });

  describe("Pausable Functionality", function () {
    it("Should respect pause state", async function () {
      const { attendance } = await loadFixture(deployFixture);
      
      await attendance.connect(owner).pause();
      
      await expect(attendance.connect(verifier).verifyAttendanceManually(
        user1.address,
        1,
        "Manual verification",
        "ipfs://badge-metadata"
      )).to.be.revertedWithCustomError(attendance, "EnforcedPause");
      
      await attendance.connect(owner).unpause();
      
      // Should work after unpause
      await attendance.connect(verifier).verifyAttendanceManually(
        user1.address,
        1,
        "Manual verification",
        "ipfs://badge-metadata"
      );
    });
  });
});

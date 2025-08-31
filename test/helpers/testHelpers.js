const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

/**
 * Helper functions for testing MintMark contracts
 */

/**
 * Deploy all contracts in the correct order with proper setup
 * @param {Array} signers - Array of ethers signers
 * @returns {Object} Object containing all deployed contracts and signers
 */
async function deployAllContracts(signers) {
  const [owner, organizer, verifier, user1, user2] = signers;
  
  // Deploy AccessControl
  const AccessControl = await ethers.getContractFactory("MintMarkAccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  
  // Add roles
  await accessControl.addOrganizer(organizer.address);
  await accessControl.addVerifier(verifier.address);
  
  // Deploy EventManager
  const EventManager = await ethers.getContractFactory("EventManager");
  const eventManager = await EventManager.deploy(await accessControl.getAddress());
  await eventManager.waitForDeployment();
  
  // Deploy BadgeNFT
  const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
  const badgeNFT = await BadgeNFT.deploy(
    await accessControl.getAddress(),
    await eventManager.getAddress()
  );
  await badgeNFT.waitForDeployment();
  
  // Deploy Attendance
  const Attendance = await ethers.getContractFactory("Attendance");
  const attendance = await Attendance.deploy(
    await accessControl.getAddress(),
    await eventManager.getAddress(),
    await badgeNFT.getAddress()
  );
  await attendance.waitForDeployment();
  
  return {
    accessControl,
    eventManager,
    badgeNFT,
    attendance,
    signers: {
      owner,
      organizer,
      verifier,
      user1,
      user2
    }
  };
}

/**
 * Create a test event with default parameters
 * @param {Object} eventManager - EventManager contract instance
 * @param {Object} organizer - Organizer signer
 * @param {Object} overrides - Optional parameter overrides
 * @returns {Object} Event parameters and transaction
 */
async function createTestEvent(eventManager, organizer, overrides = {}) {
  const now = await time.latest();
  
  const defaultParams = {
    title: "Test Event",
    description: "Test Description",
    metadataURI: `ipfs://test-metadata-${Math.random()}`,
    startTime: now - 1000, // Started
    endTime: now + 3600, // Ends in 1 hour
    maxAttendees: 100,
    location: "Test Location",
    category: "Technology"
  };
  
  const params = { ...defaultParams, ...overrides };
  
  const tx = await eventManager.connect(organizer).createEvent(
    params.title,
    params.description,
    params.metadataURI,
    params.startTime,
    params.endTime,
    params.maxAttendees,
    params.location,
    params.category
  );
  
  const receipt = await tx.wait();
  
  // Extract event ID from the transaction
  const eventCreatedLog = receipt.logs.find(log => {
    try {
      const parsed = eventManager.interface.parseLog(log);
      return parsed.name === "EventCreated";
    } catch (e) {
      return false;
    }
  });
  
  const eventId = eventCreatedLog ? 
    eventManager.interface.parseLog(eventCreatedLog).args.eventId : 
    1; // Default to 1 if parsing fails
  
  return {
    eventId: eventId.toString(),
    params,
    tx,
    receipt
  };
}

/**
 * Verify attendance for a user using manual verification
 * @param {Object} attendance - Attendance contract instance
 * @param {Object} verifier - Verifier signer
 * @param {string} userAddress - Address of the attendee
 * @param {number|string} eventId - Event ID
 * @param {string} metadataURI - Badge metadata URI
 * @returns {Object} Transaction receipt
 */
async function verifyAttendanceManually(attendance, verifier, userAddress, eventId, metadataURI) {
  const tx = await attendance.connect(verifier).verifyAttendanceManually(
    userAddress,
    eventId,
    "Test verification",
    metadataURI || `ipfs://badge-metadata-${Math.random()}`
  );
  
  return await tx.wait();
}

/**
 * Generate a QR code for an event
 * @param {Object} attendance - Attendance contract instance
 * @param {Object} organizer - Organizer signer
 * @param {number|string} eventId - Event ID
 * @param {string} secret - QR code secret
 * @param {number} expiryDuration - Expiry duration in seconds
 * @returns {Object} Transaction receipt
 */
async function generateQRCode(attendance, organizer, eventId, secret, expiryDuration = 3600) {
  const tx = await attendance.connect(organizer).generateQRCode(
    eventId,
    secret || `qr-secret-${Math.random()}`,
    expiryDuration
  );
  
  return await tx.wait();
}

/**
 * Create a digital signature for attendance verification
 * @param {Object} signer - Ethers signer (organizer/verifier)
 * @param {number|string} eventId - Event ID
 * @param {string} attendeeAddress - Address of the attendee
 * @param {number} timestamp - Timestamp for the signature
 * @returns {string} Signature
 */
async function createAttendanceSignature(signer, eventId, attendeeAddress, timestamp) {
  const messageHash = ethers.solidityPackedKeccak256(
    ["uint256", "address", "uint256"],
    [eventId, attendeeAddress, timestamp || await time.latest()]
  );
  
  return await signer.signMessage(ethers.getBytes(messageHash));
}

/**
 * Get current timestamp
 * @returns {number} Current timestamp
 */
async function getCurrentTimestamp() {
  return await time.latest();
}

/**
 * Advance time by specified seconds
 * @param {number} seconds - Seconds to advance
 */
async function advanceTime(seconds) {
  await time.increase(seconds);
}

/**
 * Set next block timestamp
 * @param {number} timestamp - Target timestamp
 */
async function setTimestamp(timestamp) {
  await time.increaseTo(timestamp);
}

/**
 * Expect an event to be emitted with specific arguments
 * @param {Object} contract - Contract instance
 * @param {Object} tx - Transaction object
 * @param {string} eventName - Event name
 * @param {Array} expectedArgs - Expected event arguments
 */
async function expectEvent(contract, tx, eventName, expectedArgs) {
  const receipt = await tx.wait();
  const eventLog = receipt.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed.name === eventName;
    } catch (e) {
      return false;
    }
  });
  
  if (!eventLog) {
    throw new Error(`Event ${eventName} not found in transaction logs`);
  }
  
  const parsedLog = contract.interface.parseLog(eventLog);
  
  if (expectedArgs) {
    expectedArgs.forEach((expectedArg, index) => {
      if (parsedLog.args[index] !== expectedArg) {
        throw new Error(
          `Event argument ${index} mismatch. Expected: ${expectedArg}, Got: ${parsedLog.args[index]}`
        );
      }
    });
  }
  
  return parsedLog;
}

/**
 * Calculate gas cost for a transaction
 * @param {Object} receipt - Transaction receipt
 * @param {number} gasPrice - Gas price in wei
 * @returns {BigInt} Gas cost in wei
 */
function calculateGasCost(receipt, gasPrice) {
  return receipt.gasUsed * BigInt(gasPrice);
}

/**
 * Format address for comparison (lowercase)
 * @param {string} address - Ethereum address
 * @returns {string} Lowercase address
 */
function formatAddress(address) {
  return address.toLowerCase();
}

/**
 * Generate random Ethereum address
 * @returns {string} Random Ethereum address
 */
function generateRandomAddress() {
  return ethers.Wallet.createRandom().address;
}

/**
 * Generate test metadata URI
 * @param {string} type - Type of metadata (event, badge, etc.)
 * @returns {string} IPFS metadata URI
 */
function generateMetadataURI(type = "test") {
  return `ipfs://${type}-metadata-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create multiple test users
 * @param {number} count - Number of users to create
 * @returns {Array} Array of wallet objects
 */
function createTestUsers(count) {
  return Array(count).fill().map(() => ethers.Wallet.createRandom());
}

/**
 * Check if address has a specific role
 * @param {Object} accessControl - AccessControl contract instance
 * @param {string} address - Address to check
 * @param {string} role - Role to check (admin, organizer, verifier)
 * @returns {boolean} True if address has role
 */
async function hasRole(accessControl, address, role) {
  switch (role.toLowerCase()) {
    case 'admin':
      return await accessControl.isAdmin(address);
    case 'organizer':
      return await accessControl.isOrganizer(address);
    case 'verifier':
      return await accessControl.isVerifier(address);
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

/**
 * Wait for a specific number of blocks
 * @param {number} blocks - Number of blocks to wait
 */
async function waitBlocks(blocks) {
  for (let i = 0; i < blocks; i++) {
    await time.advanceBlock();
  }
}

module.exports = {
  deployAllContracts,
  createTestEvent,
  verifyAttendanceManually,
  generateQRCode,
  createAttendanceSignature,
  getCurrentTimestamp,
  advanceTime,
  setTimestamp,
  expectEvent,
  calculateGasCost,
  formatAddress,
  generateRandomAddress,
  generateMetadataURI,
  createTestUsers,
  hasRole,
  waitBlocks
};

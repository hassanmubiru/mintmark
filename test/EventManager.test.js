const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("EventManager", function () {
  let accessControl, eventManager;
  let owner, organizer, admin, user;
  
  async function deployFixture() {
    [owner, organizer, admin, user] = await ethers.getSigners();
    
    // Deploy AccessControl first
    const AccessControl = await ethers.getContractFactory("MintMarkAccessControl");
    accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
    
    // Add organizer role
    await accessControl.addOrganizer(organizer.address);
    
    // Deploy EventManager
    const EventManager = await ethers.getContractFactory("EventManager");
    eventManager = await EventManager.deploy(await accessControl.getAddress());
    await eventManager.waitForDeployment();
    
    return { accessControl, eventManager, owner, organizer, admin, user };
  }

  describe("Deployment", function () {
    it("Should deploy with correct access control", async function () {
      const { eventManager, accessControl } = await loadFixture(deployFixture);
      expect(await eventManager.accessControl()).to.equal(await accessControl.getAddress());
    });

    it("Should start with zero events", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      expect(await eventManager.getTotalEvents()).to.equal(0);
    });

    it("Should reject zero address for access control", async function () {
      const EventManager = await ethers.getContractFactory("EventManager");
      await expect(EventManager.deploy(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid access control address");
    });
  });

  describe("Event Creation", function () {
    it("Should allow organizer to create event", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600; // 1 hour from now
      const endTime = startTime + 7200; // 2 hours duration
      
      await expect(eventManager.connect(organizer).createEvent(
        "Test Event",
        "Test Description",
        "ipfs://test-metadata",
        startTime,
        endTime,
        100,
        "Test Location",
        "Technology"
      )).to.emit(eventManager, "EventCreated")
        .withArgs(1, "Test Event", organizer.address, startTime, 100);
      
      expect(await eventManager.getTotalEvents()).to.equal(1);
    });

    it("Should store event data correctly", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
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
      
      const event = await eventManager.getEvent(1);
      expect(event.id).to.equal(1);
      expect(event.title).to.equal("Test Event");
      expect(event.description).to.equal("Test Description");
      expect(event.organizer).to.equal(organizer.address);
      expect(event.isActive).to.be.true;
      expect(event.maxAttendees).to.equal(100);
      expect(event.currentAttendees).to.equal(0);
    });

    it("Should reject non-organizer creating event", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
      await expect(eventManager.connect(user).createEvent(
        "Test Event",
        "Test Description",
        "ipfs://test-metadata",
        startTime,
        endTime,
        100,
        "Test Location",
        "Technology"
      )).to.be.revertedWith("Not authorized: requires organizer or admin role");
    });

    it("Should reject invalid event parameters", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const pastTime = now - 3600; // 1 hour ago
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
      // Empty title
      await expect(eventManager.connect(organizer).createEvent(
        "",
        "Test Description",
        "ipfs://test-metadata",
        startTime,
        endTime,
        100,
        "Test Location",
        "Technology"
      )).to.be.revertedWith("Title cannot be empty");
      
      // Empty description
      await expect(eventManager.connect(organizer).createEvent(
        "Test Event",
        "",
        "ipfs://test-metadata",
        startTime,
        endTime,
        100,
        "Test Location",
        "Technology"
      )).to.be.revertedWith("Description cannot be empty");
      
      // Past timestamp
      await expect(eventManager.connect(organizer).createEvent(
        "Test Event",
        "Test Description",
        "ipfs://test-metadata",
        pastTime,
        endTime,
        100,
        "Test Location",
        "Technology"
      )).to.be.revertedWith("Event must be in the future");
      
      // End time before start time
      await expect(eventManager.connect(organizer).createEvent(
        "Test Event",
        "Test Description",
        "ipfs://test-metadata",
        startTime,
        startTime - 1000,
        100,
        "Test Location",
        "Technology"
      )).to.be.revertedWith("End time must be after start time");
    });

    it("Should reject duplicate metadata URI", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
      await eventManager.connect(organizer).createEvent(
        "Test Event 1",
        "Test Description",
        "ipfs://test-metadata",
        startTime,
        endTime,
        100,
        "Test Location",
        "Technology"
      );
      
      await expect(eventManager.connect(organizer).createEvent(
        "Test Event 2",
        "Test Description",
        "ipfs://test-metadata", // Same metadata URI
        startTime + 1000,
        endTime + 1000,
        100,
        "Test Location",
        "Technology"
      )).to.be.revertedWith("Metadata URI already used");
    });
  });

  describe("Event Updates", function () {
    async function createTestEvent() {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
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
      
      return { eventManager, startTime, endTime };
    }

    it("Should allow organizer to update their event", async function () {
      const { eventManager } = await createTestEvent();
      
      const now = await time.latest();
      const newStartTime = now + 7200;
      const newEndTime = newStartTime + 3600;
      
      await expect(eventManager.connect(organizer).updateEvent(
        1,
        "Updated Event",
        "Updated Description",
        newStartTime,
        newEndTime,
        150,
        "New Location",
        "Education"
      )).to.emit(eventManager, "EventUpdated")
        .withArgs(1, "Updated Event", newStartTime, organizer.address);
      
      const event = await eventManager.getEvent(1);
      expect(event.title).to.equal("Updated Event");
      expect(event.maxAttendees).to.equal(150);
    });

    it("Should reject update by non-organizer", async function () {
      const { eventManager } = await createTestEvent();
      
      const now = await time.latest();
      const newStartTime = now + 7200;
      const newEndTime = newStartTime + 3600;
      
      await expect(eventManager.connect(user).updateEvent(
        1,
        "Updated Event",
        "Updated Description",
        newStartTime,
        newEndTime,
        150,
        "New Location",
        "Education"
      )).to.be.revertedWith("Not authorized: not event organizer or admin");
    });

    it("Should reject update to inactive event", async function () {
      const { eventManager } = await createTestEvent();
      
      // Deactivate event first
      await eventManager.connect(organizer).deactivateEvent(1, "Test deactivation");
      
      const now = await time.latest();
      const newStartTime = now + 7200;
      const newEndTime = newStartTime + 3600;
      
      await expect(eventManager.connect(organizer).updateEvent(
        1,
        "Updated Event",
        "Updated Description",
        newStartTime,
        newEndTime,
        150,
        "New Location",
        "Education"
      )).to.be.revertedWith("Cannot update inactive event");
    });
  });

  describe("Event Deactivation", function () {
    async function createTestEvent() {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
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
      
      return { eventManager };
    }

    it("Should allow organizer to deactivate event", async function () {
      const { eventManager } = await createTestEvent();
      
      await expect(eventManager.connect(organizer).deactivateEvent(1, "Test reason"))
        .to.emit(eventManager, "EventDeactivated")
        .withArgs(1, organizer.address, "Test reason");
      
      const event = await eventManager.getEvent(1);
      expect(event.isActive).to.be.false;
    });

    it("Should allow admin to activate event", async function () {
      const { eventManager, accessControl } = await createTestEvent();
      
      await eventManager.connect(organizer).deactivateEvent(1, "Test reason");
      
      await expect(eventManager.connect(owner).activateEvent(1))
        .to.emit(eventManager, "EventActivated")
        .withArgs(1, owner.address);
      
      const event = await eventManager.getEvent(1);
      expect(event.isActive).to.be.true;
    });
  });

  describe("Attendee Management", function () {
    async function createTestEvent() {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
      await eventManager.connect(organizer).createEvent(
        "Test Event",
        "Test Description",
        "ipfs://test-metadata",
        startTime,
        endTime,
        2, // Max 2 attendees
        "Test Location",
        "Technology"
      );
      
      return { eventManager, startTime, endTime };
    }

    it("Should increment attendee count", async function () {
      const { eventManager } = await createTestEvent();
      
      await eventManager.incrementAttendeeCount(1);
      
      const event = await eventManager.getEvent(1);
      expect(event.currentAttendees).to.equal(1);
    });

    it("Should reject increment beyond capacity", async function () {
      const { eventManager } = await createTestEvent();
      
      await eventManager.incrementAttendeeCount(1);
      await eventManager.incrementAttendeeCount(1);
      
      await expect(eventManager.incrementAttendeeCount(1))
        .to.be.revertedWith("Event is at maximum capacity");
    });

    it("Should allow unlimited attendees when max is 0", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
      await eventManager.connect(organizer).createEvent(
        "Test Event",
        "Test Description",
        "ipfs://test-metadata",
        startTime,
        endTime,
        0, // Unlimited
        "Test Location",
        "Technology"
      );
      
      // Should not revert
      for (let i = 0; i < 100; i++) {
        await eventManager.incrementAttendeeCount(1);
      }
      
      const event = await eventManager.getEvent(1);
      expect(event.currentAttendees).to.equal(100);
    });
  });

  describe("Event Status Checking", function () {
    it("Should correctly identify ongoing events", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now - 1000; // Started 1000 seconds ago
      const endTime = now + 1000; // Ends in 1000 seconds
      
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
      
      expect(await eventManager.isEventOngoing(1)).to.be.true;
    });

    it("Should correctly identify capacity status", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
      await eventManager.connect(organizer).createEvent(
        "Test Event",
        "Test Description",
        "ipfs://test-metadata",
        startTime,
        endTime,
        1, // Max 1 attendee
        "Test Location",
        "Technology"
      );
      
      expect(await eventManager.hasCapacity(1)).to.be.true;
      
      await eventManager.incrementAttendeeCount(1);
      expect(await eventManager.hasCapacity(1)).to.be.false;
    });
  });

  describe("Event Queries", function () {
    it("Should get organizer events correctly", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
      // Create two events
      await eventManager.connect(organizer).createEvent(
        "Test Event 1",
        "Test Description",
        "ipfs://test-metadata-1",
        startTime,
        endTime,
        100,
        "Test Location",
        "Technology"
      );
      
      await eventManager.connect(organizer).createEvent(
        "Test Event 2",
        "Test Description",
        "ipfs://test-metadata-2",
        startTime + 1000,
        endTime + 1000,
        100,
        "Test Location",
        "Technology"
      );
      
      const organizerEvents = await eventManager.getOrganizerEvents(organizer.address);
      expect(organizerEvents).to.have.length(2);
      expect(organizerEvents[0]).to.equal(1);
      expect(organizerEvents[1]).to.equal(2);
    });

    it("Should get events by category", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
      // Create events in different categories
      await eventManager.connect(organizer).createEvent(
        "Tech Event",
        "Test Description",
        "ipfs://test-metadata-1",
        startTime,
        endTime,
        100,
        "Test Location",
        "Technology"
      );
      
      await eventManager.connect(organizer).createEvent(
        "Art Event",
        "Test Description",
        "ipfs://test-metadata-2",
        startTime + 1000,
        endTime + 1000,
        100,
        "Test Location",
        "Art"
      );
      
      const techEvents = await eventManager.getEventsByCategory("Technology");
      const artEvents = await eventManager.getEventsByCategory("Art");
      
      expect(techEvents).to.have.length(1);
      expect(artEvents).to.have.length(1);
      expect(techEvents[0]).to.equal(1);
      expect(artEvents[0]).to.equal(2);
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow admin to pause and unpause", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      await eventManager.connect(owner).pause();
      
      const now = await time.latest();
      const startTime = now + 3600;
      const endTime = startTime + 7200;
      
      await expect(eventManager.connect(organizer).createEvent(
        "Test Event",
        "Test Description",
        "ipfs://test-metadata",
        startTime,
        endTime,
        100,
        "Test Location",
        "Technology"
      )).to.be.revertedWithCustomError(eventManager, "EnforcedPause");
      
      await eventManager.connect(owner).unpause();
      
      // Should work after unpause
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
    });
  });

  describe("Edge Cases", function () {
    it("Should handle non-existent event queries", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      await expect(eventManager.getEvent(999))
        .to.be.revertedWith("Event does not exist");
    });

    it("Should handle empty organizer events list", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const events = await eventManager.getOrganizerEvents(user.address);
      expect(events).to.have.length(0);
    });

    it("Should handle empty category searches", async function () {
      const { eventManager } = await loadFixture(deployFixture);
      
      const events = await eventManager.getEventsByCategory("NonExistent");
      expect(events).to.have.length(0);
    });
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MintMarkAccessControl", function () {
  let accessControl;
  let owner, admin, organizer, verifier, user;
  
  beforeEach(async function () {
    [owner, admin, organizer, verifier, user] = await ethers.getSigners();
    
    const AccessControl = await ethers.getContractFactory("MintMarkAccessControl");
    accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer as default admin", async function () {
      expect(await accessControl.isAdmin(owner.address)).to.be.true;
      expect(await accessControl.hasRole(await accessControl.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should have correct role hierarchies", async function () {
      const defaultAdminRole = await accessControl.DEFAULT_ADMIN_ROLE();
      const organizerRole = await accessControl.ORGANIZER_ROLE();
      const verifierRole = await accessControl.VERIFIER_ROLE();
      
      expect(await accessControl.getRoleAdmin(organizerRole)).to.equal(defaultAdminRole);
      expect(await accessControl.getRoleAdmin(verifierRole)).to.equal(defaultAdminRole);
    });
  });

  describe("Organizer Role Management", function () {
    it("Should allow admin to add organizer", async function () {
      await expect(accessControl.addOrganizer(organizer.address))
        .to.emit(accessControl, "OrganizerAdded")
        .withArgs(organizer.address, owner.address);
      
      expect(await accessControl.isOrganizer(organizer.address)).to.be.true;
    });

    it("Should allow admin to remove organizer", async function () {
      await accessControl.addOrganizer(organizer.address);
      
      await expect(accessControl.removeOrganizer(organizer.address))
        .to.emit(accessControl, "OrganizerRemoved")
        .withArgs(organizer.address, owner.address);
      
      expect(await accessControl.isOrganizer(organizer.address)).to.be.false;
    });

    it("Should reject invalid organizer address", async function () {
      await expect(accessControl.addOrganizer(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid organizer address");
    });

    it("Should reject non-admin trying to add organizer", async function () {
      await expect(accessControl.connect(user).addOrganizer(organizer.address))
        .to.be.revertedWithCustomError(accessControl, "AccessControlUnauthorizedAccount")
        .withArgs(user.address, await accessControl.DEFAULT_ADMIN_ROLE());
    });

    it("Should handle batch organizer addition", async function () {
      const organizers = [organizer.address, verifier.address];
      
      await expect(accessControl.batchAddOrganizers(organizers))
        .to.emit(accessControl, "OrganizerAdded")
        .withArgs(organizer.address, owner.address);
      
      expect(await accessControl.isOrganizer(organizer.address)).to.be.true;
      expect(await accessControl.isOrganizer(verifier.address)).to.be.true;
    });

    it("Should reject batch addition with invalid addresses", async function () {
      const organizers = [organizer.address, ethers.ZeroAddress];
      
      await expect(accessControl.batchAddOrganizers(organizers))
        .to.be.revertedWith("Invalid organizer address");
    });
  });

  describe("Verifier Role Management", function () {
    it("Should allow admin to add verifier", async function () {
      await expect(accessControl.addVerifier(verifier.address))
        .to.emit(accessControl, "VerifierAdded")
        .withArgs(verifier.address, owner.address);
      
      expect(await accessControl.isVerifier(verifier.address)).to.be.true;
    });

    it("Should allow admin to remove verifier", async function () {
      await accessControl.addVerifier(verifier.address);
      
      await expect(accessControl.removeVerifier(verifier.address))
        .to.emit(accessControl, "VerifierRemoved")
        .withArgs(verifier.address, owner.address);
      
      expect(await accessControl.isVerifier(verifier.address)).to.be.false;
    });

    it("Should reject invalid verifier address", async function () {
      await expect(accessControl.addVerifier(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid verifier address");
    });

    it("Should reject non-admin trying to add verifier", async function () {
      await expect(accessControl.connect(user).addVerifier(verifier.address))
        .to.be.revertedWithCustomError(accessControl, "AccessControlUnauthorizedAccount")
        .withArgs(user.address, await accessControl.DEFAULT_ADMIN_ROLE());
    });
  });

  describe("Role Checking", function () {
    beforeEach(async function () {
      await accessControl.addOrganizer(organizer.address);
      await accessControl.addVerifier(verifier.address);
    });

    it("Should correctly identify roles", async function () {
      expect(await accessControl.isAdmin(owner.address)).to.be.true;
      expect(await accessControl.isOrganizer(organizer.address)).to.be.true;
      expect(await accessControl.isVerifier(verifier.address)).to.be.true;
      
      expect(await accessControl.isAdmin(user.address)).to.be.false;
      expect(await accessControl.isOrganizer(user.address)).to.be.false;
      expect(await accessControl.isVerifier(user.address)).to.be.false;
    });

    it("Should handle multiple roles correctly", async function () {
      // Give organizer role to admin
      await accessControl.addOrganizer(owner.address);
      
      expect(await accessControl.isAdmin(owner.address)).to.be.true;
      expect(await accessControl.isOrganizer(owner.address)).to.be.true;
      expect(await accessControl.isVerifier(owner.address)).to.be.false;
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to grant emergency admin", async function () {
      await accessControl.emergencyGrantAdmin(admin.address);
      expect(await accessControl.isAdmin(admin.address)).to.be.true;
    });

    it("Should reject invalid emergency admin address", async function () {
      await expect(accessControl.emergencyGrantAdmin(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid admin address");
    });

    it("Should reject non-owner trying emergency grant", async function () {
      await expect(accessControl.connect(user).emergencyGrantAdmin(admin.address))
        .to.be.revertedWithCustomError(accessControl, "OwnableUnauthorizedAccount")
        .withArgs(user.address);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle role removal for non-existent role", async function () {
      // Should not revert, just do nothing
      await accessControl.removeOrganizer(user.address);
      expect(await accessControl.isOrganizer(user.address)).to.be.false;
    });

    it("Should handle adding same role twice", async function () {
      await accessControl.addOrganizer(organizer.address);
      await accessControl.addOrganizer(organizer.address); // Should not revert
      expect(await accessControl.isOrganizer(organizer.address)).to.be.true;
    });

    it("Should maintain role count correctly", async function () {
      const organizerRole = await accessControl.ORGANIZER_ROLE();
      
      await accessControl.addOrganizer(organizer.address);
      await accessControl.addOrganizer(verifier.address);
      
      // Note: This would require additional implementation in the contract
      // to track role member counts if needed
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for role operations", async function () {
      const tx = await accessControl.addOrganizer(organizer.address);
      const receipt = await tx.wait();
      
      // Gas usage should be reasonable (adjust threshold as needed)
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });

    it("Should be efficient for batch operations", async function () {
      const organizers = Array(5).fill().map((_, i) => 
        ethers.Wallet.createRandom().address
      );
      
      const tx = await accessControl.batchAddOrganizers(organizers);
      const receipt = await tx.wait();
      
      // Should be more efficient than individual calls
      expect(receipt.gasUsed).to.be.lessThan(300000);
    });
  });
});

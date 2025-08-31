// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MintMarkAccessControl
 * @dev Manages roles and permissions for the MintMark platform
 * Inherits from OpenZeppelin's AccessControl for role-based permissions
 */
contract MintMarkAccessControl is AccessControl, Ownable {
    // Define custom roles
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Events
    event OrganizerAdded(address indexed organizer, address indexed admin);
    event OrganizerRemoved(address indexed organizer, address indexed admin);
    event VerifierAdded(address indexed verifier, address indexed admin);
    event VerifierRemoved(address indexed verifier, address indexed admin);

    /**
     * @dev Constructor sets the deployer as the default admin
     */
    constructor() Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(ORGANIZER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(VERIFIER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    /**
     * @dev Add an organizer (only admin can call)
     * @param organizer Address to grant organizer role
     */
    function addOrganizer(address organizer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(organizer != address(0), "Invalid organizer address");
        _grantRole(ORGANIZER_ROLE, organizer);
        emit OrganizerAdded(organizer, msg.sender);
    }

    /**
     * @dev Remove an organizer (only admin can call)
     * @param organizer Address to revoke organizer role
     */
    function removeOrganizer(address organizer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ORGANIZER_ROLE, organizer);
        emit OrganizerRemoved(organizer, msg.sender);
    }

    /**
     * @dev Add a verifier (only admin can call)
     * @param verifier Address to grant verifier role
     */
    function addVerifier(address verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(verifier != address(0), "Invalid verifier address");
        _grantRole(VERIFIER_ROLE, verifier);
        emit VerifierAdded(verifier, msg.sender);
    }

    /**
     * @dev Remove a verifier (only admin can call)
     * @param verifier Address to revoke verifier role
     */
    function removeVerifier(address verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(VERIFIER_ROLE, verifier);
        emit VerifierRemoved(verifier, msg.sender);
    }

    /**
     * @dev Check if address is an organizer
     * @param account Address to check
     * @return bool True if account has organizer role
     */
    function isOrganizer(address account) external view returns (bool) {
        return hasRole(ORGANIZER_ROLE, account);
    }

    /**
     * @dev Check if address is a verifier
     * @param account Address to check
     * @return bool True if account has verifier role
     */
    function isVerifier(address account) external view returns (bool) {
        return hasRole(VERIFIER_ROLE, account);
    }

    /**
     * @dev Check if address is an admin
     * @param account Address to check
     * @return bool True if account has admin role
     */
    function isAdmin(address account) external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, account);
    }



    /**
     * @dev Batch add organizers (gas efficient for multiple additions)
     * @param organizers Array of addresses to grant organizer role
     */
    function batchAddOrganizers(address[] calldata organizers) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        for (uint256 i = 0; i < organizers.length; i++) {
            require(organizers[i] != address(0), "Invalid organizer address");
            _grantRole(ORGANIZER_ROLE, organizers[i]);
            emit OrganizerAdded(organizers[i], msg.sender);
        }
    }

    /**
     * @dev Emergency pause function (only owner)
     * This can be used to pause the entire system if needed
     */
    function emergencyGrantAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "Invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
    }
}

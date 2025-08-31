// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./AccessControl.sol";
import "./EventManager.sol";

/**
 * @title BadgeNFT
 * @dev ERC-721 NFT contract for MintMark attendance badges
 * Issues unique NFTs to users who attend verified events
 */
contract BadgeNFT is ERC721, ERC721URIStorage, ERC721Enumerable, ReentrancyGuard, Pausable {
    
    MintMarkAccessControl public accessControl;
    EventManager public eventManager;

    // Badge structure
    struct Badge {
        uint256 tokenId;
        uint256 eventId;
        address attendee;
        uint256 mintedAt;
        string metadataURI;
        bool isRevoked;
        string revokeReason;
    }

    // State variables
    uint256 private _tokenIdCounter;
    mapping(uint256 => Badge) public badges;
    mapping(uint256 => uint256[]) public eventBadges; // eventId => tokenIds
    mapping(address => uint256[]) public userBadges; // user => tokenIds
    mapping(uint256 => mapping(address => bool)) public eventAttendance; // eventId => user => attended
    mapping(uint256 => bool) public revokedTokens;

    // Badge rarity/streak tracking
    mapping(address => uint256) public userStreak;
    mapping(address => uint256) public userTotalBadges;
    mapping(string => uint256) public categoryBadgeCount; // user category badge counts

    // Events
    event BadgeMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed attendee,
        string metadataURI
    );
    
    event BadgeRevoked(
        uint256 indexed tokenId,
        address indexed revokedBy,
        string reason
    );
    
    event BadgeRestored(
        uint256 indexed tokenId,
        address indexed restoredBy
    );

    event StreakUpdated(
        address indexed user,
        uint256 newStreak
    );

    // Modifiers
    modifier onlyAuthorized() {
        require(
            accessControl.hasRole(accessControl.ORGANIZER_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.VERIFIER_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Not authorized: requires organizer, verifier, or admin role"
        );
        _;
    }

    modifier onlyAdmin() {
        require(
            accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Not authorized: requires admin role"
        );
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }

    modifier notRevoked(uint256 tokenId) {
        require(!revokedTokens[tokenId], "Token has been revoked");
        _;
    }

    /**
     * @dev Constructor
     * @param _accessControl Address of the AccessControl contract
     * @param _eventManager Address of the EventManager contract
     */
    constructor(
        address _accessControl,
        address _eventManager
    ) ERC721("MintMark Badge", "MINTMARK") {
        require(_accessControl != address(0), "Invalid access control address");
        require(_eventManager != address(0), "Invalid event manager address");
        
        accessControl = MintMarkAccessControl(_accessControl);
        eventManager = EventManager(_eventManager);
        _tokenIdCounter = 0;
    }

    /**
     * @dev Mint a badge to an attendee for a specific event
     * @param attendee Address of the attendee
     * @param eventId ID of the event
     * @param metadataURI IPFS URI for the badge metadata
     * @return tokenId The ID of the minted token
     */
    function mintBadge(
        address attendee,
        uint256 eventId,
        string memory metadataURI
    ) public onlyAuthorized whenNotPaused nonReentrant returns (uint256) {
        require(attendee != address(0), "Invalid attendee address");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(!eventAttendance[eventId][attendee], "Badge already minted for this event");

        // Verify event exists and is valid
        EventManager.Event memory eventData = eventManager.getEvent(eventId);
        require(eventData.id == eventId, "Event does not exist");
        require(eventData.isActive, "Event is not active");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        // Mint the NFT
        _safeMint(attendee, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Create badge record
        badges[tokenId] = Badge({
            tokenId: tokenId,
            eventId: eventId,
            attendee: attendee,
            mintedAt: block.timestamp,
            metadataURI: metadataURI,
            isRevoked: false,
            revokeReason: ""
        });

        // Update mappings
        eventBadges[eventId].push(tokenId);
        userBadges[attendee].push(tokenId);
        eventAttendance[eventId][attendee] = true;
        userTotalBadges[attendee]++;

        // Update streak
        _updateUserStreak(attendee);

        emit BadgeMinted(tokenId, eventId, attendee, metadataURI);
        
        return tokenId;
    }

    /**
     * @dev Revoke a badge (admin only)
     * @param tokenId ID of the token to revoke
     * @param reason Reason for revocation
     */
    function revokeBadge(
        uint256 tokenId,
        string memory reason
    ) external tokenExists(tokenId) onlyAdmin {
        require(!revokedTokens[tokenId], "Token already revoked");
        require(bytes(reason).length > 0, "Reason cannot be empty");

        revokedTokens[tokenId] = true;
        badges[tokenId].isRevoked = true;
        badges[tokenId].revokeReason = reason;

        // Update user's total badge count
        address owner = ownerOf(tokenId);
        if (userTotalBadges[owner] > 0) {
            userTotalBadges[owner]--;
        }

        emit BadgeRevoked(tokenId, msg.sender, reason);
    }

    /**
     * @dev Restore a revoked badge (admin only)
     * @param tokenId ID of the token to restore
     */
    function restoreBadge(uint256 tokenId) external tokenExists(tokenId) onlyAdmin {
        require(revokedTokens[tokenId], "Token is not revoked");

        revokedTokens[tokenId] = false;
        badges[tokenId].isRevoked = false;
        badges[tokenId].revokeReason = "";

        // Update user's total badge count
        address owner = ownerOf(tokenId);
        userTotalBadges[owner]++;

        emit BadgeRestored(tokenId, msg.sender);
    }

    /**
     * @dev Update user's attendance streak
     * @param user Address of the user
     */
    function _updateUserStreak(address user) private {
        // Simple streak logic - increment for each badge
        // In a more sophisticated system, this could check for consecutive attendance
        userStreak[user]++;
        emit StreakUpdated(user, userStreak[user]);
    }

    /**
     * @dev Get badge details
     * @param tokenId ID of the token
     * @return Badge struct
     */
    function getBadge(uint256 tokenId) external view tokenExists(tokenId) returns (Badge memory) {
        return badges[tokenId];
    }

    /**
     * @dev Get all badges for a specific event
     * @param eventId ID of the event
     * @return Array of token IDs
     */
    function getEventBadges(uint256 eventId) external view returns (uint256[] memory) {
        return eventBadges[eventId];
    }

    /**
     * @dev Get all badges owned by a user
     * @param user Address of the user
     * @return Array of token IDs
     */
    function getUserBadges(address user) external view returns (uint256[] memory) {
        return userBadges[user];
    }

    /**
     * @dev Get user's active (non-revoked) badges
     * @param user Address of the user
     * @return Array of token IDs
     */
    function getUserActiveBadges(address user) external view returns (uint256[] memory) {
        uint256[] memory allBadges = userBadges[user];
        uint256[] memory activeBadges = new uint256[](allBadges.length);
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allBadges.length; i++) {
            if (!revokedTokens[allBadges[i]]) {
                activeBadges[activeCount] = allBadges[i];
                activeCount++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeBadges[i];
        }

        return result;
    }

    /**
     * @dev Check if user attended a specific event
     * @param eventId ID of the event
     * @param user Address of the user
     * @return bool True if user attended
     */
    function hasAttended(uint256 eventId, address user) external view returns (bool) {
        return eventAttendance[eventId][user];
    }

    /**
     * @dev Get user statistics
     * @param user Address of the user
     * @return totalBadges Total badges earned
     * @return activeBadges Active (non-revoked) badges
     * @return streak Current streak
     */
    function getUserStats(address user) external view returns (
        uint256 totalBadges,
        uint256 activeBadges,
        uint256 streak
    ) {
        uint256[] memory allBadges = userBadges[user];
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allBadges.length; i++) {
            if (!revokedTokens[allBadges[i]]) {
                activeCount++;
            }
        }

        return (allBadges.length, activeCount, userStreak[user]);
    }

    /**
     * @dev Get total number of badges minted
     * @return Total badge count
     */
    function getTotalBadges() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Batch mint badges (gas efficient for multiple attendees)
     * @param attendees Array of attendee addresses
     * @param eventId ID of the event
     * @param metadataURIs Array of metadata URIs
     */
    function batchMintBadges(
        address[] calldata attendees,
        uint256 eventId,
        string[] calldata metadataURIs
    ) external onlyAuthorized whenNotPaused nonReentrant {
        require(attendees.length == metadataURIs.length, "Arrays length mismatch");
        require(attendees.length > 0, "Empty arrays");

        for (uint256 i = 0; i < attendees.length; i++) {
            mintBadge(attendees[i], eventId, metadataURIs[i]);
        }
    }

    /**
     * @dev Emergency pause (admin only)
     */
    function pause() external onlyAdmin {
        _pause();
    }

    /**
     * @dev Unpause (admin only)
     */
    function unpause() external onlyAdmin {
        _unpause();
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Prevent token transfers if revoked
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual {
        if (from != address(0) && to != address(0)) {
            require(!revokedTokens[tokenId], "Cannot transfer revoked token");
        }
    }
}

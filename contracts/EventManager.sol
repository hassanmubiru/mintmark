// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EventManager
 * @dev Manages event creation, updates, and lifecycle for MintMark platform
 */
contract EventManager is ReentrancyGuard, Pausable {
    
    MintMarkAccessControl public accessControl;

    // Event structure
    struct Event {
        uint256 id;
        string title;
        string description;
        string metadataURI;
        uint256 timestamp;
        uint256 endTimestamp;
        address organizer;
        bool isActive;
        uint256 maxAttendees;
        uint256 currentAttendees;
        string location;
        string category;
        uint256 createdAt;
    }

    // State variables
    uint256 private _eventIdCounter;
    mapping(uint256 => Event) public events;
    mapping(address => uint256[]) public organizerEvents;
    mapping(string => bool) private _usedMetadataURIs;

    // Events
    event EventCreated(
        uint256 indexed eventId,
        string title,
        address indexed organizer,
        uint256 timestamp,
        uint256 maxAttendees
    );
    
    event EventUpdated(
        uint256 indexed eventId,
        string title,
        uint256 timestamp,
        address indexed updatedBy
    );
    
    event EventDeactivated(
        uint256 indexed eventId,
        address indexed deactivatedBy,
        string reason
    );
    
    event EventActivated(
        uint256 indexed eventId,
        address indexed activatedBy
    );

    event AttendeeCountUpdated(
        uint256 indexed eventId,
        uint256 newCount
    );

    // Modifiers
    modifier onlyOrganizerOrAdmin() {
        require(
            accessControl.hasRole(accessControl.ORGANIZER_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Not authorized: requires organizer or admin role"
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

    modifier eventExists(uint256 eventId) {
        require(eventId > 0 && eventId <= _eventIdCounter, "Event does not exist");
        _;
    }

    modifier onlyEventOrganizer(uint256 eventId) {
        require(
            events[eventId].organizer == msg.sender ||
            accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Not authorized: not event organizer or admin"
        );
        _;
    }

    /**
     * @dev Constructor
     * @param _accessControl Address of the AccessControl contract
     */
    constructor(address _accessControl) {
        require(_accessControl != address(0), "Invalid access control address");
        accessControl = MintMarkAccessControl(_accessControl);
        _eventIdCounter = 0;
    }

    /**
     * @dev Create a new event
     * @param title Event title
     * @param description Event description
     * @param metadataURI IPFS URI for event metadata
     * @param timestamp Event start timestamp
     * @param endTimestamp Event end timestamp
     * @param maxAttendees Maximum number of attendees (0 for unlimited)
     * @param location Event location
     * @param category Event category
     * @return eventId The ID of the created event
     */
    function createEvent(
        string memory title,
        string memory description,
        string memory metadataURI,
        uint256 timestamp,
        uint256 endTimestamp,
        uint256 maxAttendees,
        string memory location,
        string memory category
    ) external onlyOrganizerOrAdmin whenNotPaused nonReentrant returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(timestamp > block.timestamp, "Event must be in the future");
        require(endTimestamp > timestamp, "End time must be after start time");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(!_usedMetadataURIs[metadataURI], "Metadata URI already used");

        _eventIdCounter++;
        uint256 eventId = _eventIdCounter;

        events[eventId] = Event({
            id: eventId,
            title: title,
            description: description,
            metadataURI: metadataURI,
            timestamp: timestamp,
            endTimestamp: endTimestamp,
            organizer: msg.sender,
            isActive: true,
            maxAttendees: maxAttendees,
            currentAttendees: 0,
            location: location,
            category: category,
            createdAt: block.timestamp
        });

        organizerEvents[msg.sender].push(eventId);
        _usedMetadataURIs[metadataURI] = true;

        emit EventCreated(eventId, title, msg.sender, timestamp, maxAttendees);
        
        return eventId;
    }

    /**
     * @dev Update an existing event
     * @param eventId ID of the event to update
     * @param title New title
     * @param description New description
     * @param timestamp New timestamp
     * @param endTimestamp New end timestamp
     * @param maxAttendees New max attendees
     * @param location New location
     * @param category New category
     */
    function updateEvent(
        uint256 eventId,
        string memory title,
        string memory description,
        uint256 timestamp,
        uint256 endTimestamp,
        uint256 maxAttendees,
        string memory location,
        string memory category
    ) external eventExists(eventId) onlyEventOrganizer(eventId) whenNotPaused {
        Event storage eventData = events[eventId];
        require(eventData.isActive, "Cannot update inactive event");
        require(timestamp > block.timestamp, "Event must be in the future");
        require(endTimestamp > timestamp, "End time must be after start time");
        require(bytes(title).length > 0, "Title cannot be empty");

        eventData.title = title;
        eventData.description = description;
        eventData.timestamp = timestamp;
        eventData.endTimestamp = endTimestamp;
        eventData.maxAttendees = maxAttendees;
        eventData.location = location;
        eventData.category = category;

        emit EventUpdated(eventId, title, timestamp, msg.sender);
    }

    /**
     * @dev Deactivate an event
     * @param eventId ID of the event to deactivate
     * @param reason Reason for deactivation
     */
    function deactivateEvent(
        uint256 eventId,
        string memory reason
    ) external eventExists(eventId) onlyEventOrganizer(eventId) {
        events[eventId].isActive = false;
        emit EventDeactivated(eventId, msg.sender, reason);
    }

    /**
     * @dev Activate an event (admin only)
     * @param eventId ID of the event to activate
     */
    function activateEvent(uint256 eventId) external eventExists(eventId) onlyAdmin {
        events[eventId].isActive = true;
        emit EventActivated(eventId, msg.sender);
    }

    /**
     * @dev Increment attendee count (called by Attendance contract)
     * @param eventId ID of the event
     */
    function incrementAttendeeCount(uint256 eventId) external eventExists(eventId) {
        // This should only be called by the Attendance contract
        // In a production environment, you'd want to restrict this to a specific contract address
        Event storage eventData = events[eventId];
        require(eventData.isActive, "Event is not active");
        require(
            eventData.maxAttendees == 0 || eventData.currentAttendees < eventData.maxAttendees,
            "Event is at maximum capacity"
        );
        
        eventData.currentAttendees++;
        emit AttendeeCountUpdated(eventId, eventData.currentAttendees);
    }

    /**
     * @dev Get event details
     * @param eventId ID of the event
     * @return Event struct
     */
    function getEvent(uint256 eventId) external view eventExists(eventId) returns (Event memory) {
        return events[eventId];
    }

    /**
     * @dev Get events organized by a specific address
     * @param organizer Address of the organizer
     * @return Array of event IDs
     */
    function getOrganizerEvents(address organizer) external view returns (uint256[] memory) {
        return organizerEvents[organizer];
    }

    /**
     * @dev Get total number of events created
     * @return Total event count
     */
    function getTotalEvents() external view returns (uint256) {
        return _eventIdCounter;
    }

    /**
     * @dev Check if event is currently active and ongoing
     * @param eventId ID of the event
     * @return bool True if event is active and within time bounds
     */
    function isEventOngoing(uint256 eventId) external view eventExists(eventId) returns (bool) {
        Event memory eventData = events[eventId];
        return eventData.isActive && 
               block.timestamp >= eventData.timestamp && 
               block.timestamp <= eventData.endTimestamp;
    }

    /**
     * @dev Check if event has capacity for more attendees
     * @param eventId ID of the event
     * @return bool True if event has capacity
     */
    function hasCapacity(uint256 eventId) external view eventExists(eventId) returns (bool) {
        Event memory eventData = events[eventId];
        return eventData.maxAttendees == 0 || eventData.currentAttendees < eventData.maxAttendees;
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
     * @dev Get events by category
     * @param category Category to filter by
     * @return Array of event IDs
     */
    function getEventsByCategory(string memory category) external view returns (uint256[] memory) {
        uint256[] memory categoryEvents = new uint256[](_eventIdCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _eventIdCounter; i++) {
            if (keccak256(bytes(events[i].category)) == keccak256(bytes(category))) {
                categoryEvents[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = categoryEvents[i];
        }
        
        return result;
    }
}

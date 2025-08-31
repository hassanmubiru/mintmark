// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";
import "./EventManager.sol";
import "./BadgeNFT.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title Attendance
 * @dev Manages attendance verification and badge minting for MintMark events
 * Supports both signature-based and QR code verification
 */
contract Attendance is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    MintMarkAccessControl public accessControl;
    EventManager public eventManager;
    BadgeNFT public badgeNFT;

    // Attendance verification methods
    enum VerificationMethod {
        SIGNATURE,
        QR_CODE,
        MANUAL
    }

    // Attendance record structure
    struct AttendanceRecord {
        address attendee;
        uint256 eventId;
        uint256 timestamp;
        VerificationMethod method;
        address verifiedBy;
        string proofData; // signature, QR code data, or manual verification notes
        bool badgeMinted;
        uint256 tokenId;
    }

    // State variables
    mapping(uint256 => mapping(address => AttendanceRecord)) public attendanceRecords;
    mapping(uint256 => address[]) public eventAttendees;
    mapping(uint256 => mapping(address => bool)) public hasAttended;
    mapping(bytes32 => bool) public usedSignatures;
    mapping(string => bool) public usedQRCodes;
    
    // QR code verification
    mapping(uint256 => string) public eventQRSecrets;
    mapping(uint256 => uint256) public qrCodeExpiry;

    // Events
    event AttendanceVerified(
        address indexed attendee,
        uint256 indexed eventId,
        VerificationMethod method,
        address indexed verifiedBy
    );
    
    event QRCodeGenerated(
        uint256 indexed eventId,
        string qrCodeHash,
        uint256 expiryTime
    );
    
    event BadgeIssued(
        address indexed attendee,
        uint256 indexed eventId,
        uint256 indexed tokenId
    );

    event AttendanceRevoked(
        address indexed attendee,
        uint256 indexed eventId,
        address indexed revokedBy,
        string reason
    );

    // Modifiers
    modifier onlyVerifier() {
        require(
            accessControl.hasRole(accessControl.VERIFIER_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.ORGANIZER_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Not authorized: requires verifier, organizer, or admin role"
        );
        _;
    }

    modifier onlyOrganizerOrAdmin() {
        require(
            accessControl.hasRole(accessControl.ORGANIZER_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Not authorized: requires organizer or admin role"
        );
        _;
    }

    modifier eventActive(uint256 eventId) {
        require(eventManager.isEventOngoing(eventId), "Event is not currently active");
        _;
    }

    /**
     * @dev Constructor
     * @param _accessControl Address of the AccessControl contract
     * @param _eventManager Address of the EventManager contract
     * @param _badgeNFT Address of the BadgeNFT contract
     */
    constructor(
        address _accessControl,
        address _eventManager,
        address _badgeNFT
    ) {
        require(_accessControl != address(0), "Invalid access control address");
        require(_eventManager != address(0), "Invalid event manager address");
        require(_badgeNFT != address(0), "Invalid badge NFT address");
        
        accessControl = MintMarkAccessControl(_accessControl);
        eventManager = EventManager(_eventManager);
        badgeNFT = BadgeNFT(_badgeNFT);
    }

    /**
     * @dev Verify attendance using digital signature
     * @param eventId ID of the event
     * @param signature Signature from the attendee
     * @param metadataURI Metadata URI for the badge
     */
    function verifyAttendanceBySignature(
        uint256 eventId,
        bytes memory signature,
        string memory metadataURI
    ) external eventActive(eventId) whenNotPaused nonReentrant {
        require(!hasAttended[eventId][msg.sender], "Already verified attendance");
        require(eventManager.hasCapacity(eventId), "Event at maximum capacity");
        
        // Create message hash
        bytes32 messageHash = keccak256(
            abi.encodePacked(eventId, msg.sender, block.timestamp)
        ).toEthSignedMessageHash();
        
        require(!usedSignatures[messageHash], "Signature already used");
        
        // Verify signature (in a real implementation, you'd verify against organizer's signature)
        address signer = messageHash.recover(signature);
        require(
            accessControl.hasRole(accessControl.ORGANIZER_ROLE(), signer) ||
            accessControl.hasRole(accessControl.VERIFIER_ROLE(), signer),
            "Invalid signature: not from authorized verifier"
        );

        _recordAttendance(
            msg.sender,
            eventId,
            VerificationMethod.SIGNATURE,
            signer,
            string(signature),
            metadataURI
        );

        usedSignatures[messageHash] = true;
    }

    /**
     * @dev Verify attendance using QR code
     * @param eventId ID of the event
     * @param qrSecret Secret from QR code
     * @param metadataURI Metadata URI for the badge
     */
    function verifyAttendanceByQR(
        uint256 eventId,
        string memory qrSecret,
        string memory metadataURI
    ) external eventActive(eventId) whenNotPaused nonReentrant {
        require(!hasAttended[eventId][msg.sender], "Already verified attendance");
        require(eventManager.hasCapacity(eventId), "Event at maximum capacity");
        require(bytes(eventQRSecrets[eventId]).length > 0, "QR code not generated for event");
        require(block.timestamp <= qrCodeExpiry[eventId], "QR code expired");
        
        string memory expectedSecret = eventQRSecrets[eventId];
        require(
            keccak256(bytes(qrSecret)) == keccak256(bytes(expectedSecret)),
            "Invalid QR code secret"
        );

        string memory qrCodeId = string(abi.encodePacked(eventId, qrSecret));
        require(!usedQRCodes[qrCodeId], "QR code already used");

        _recordAttendance(
            msg.sender,
            eventId,
            VerificationMethod.QR_CODE,
            msg.sender,
            qrSecret,
            metadataURI
        );

        usedQRCodes[qrCodeId] = true;
    }

    /**
     * @dev Manual attendance verification by organizer/verifier
     * @param attendee Address of the attendee
     * @param eventId ID of the event
     * @param notes Verification notes
     * @param metadataURI Metadata URI for the badge
     */
    function verifyAttendanceManually(
        address attendee,
        uint256 eventId,
        string memory notes,
        string memory metadataURI
    ) external onlyVerifier eventActive(eventId) whenNotPaused nonReentrant {
        require(attendee != address(0), "Invalid attendee address");
        require(!hasAttended[eventId][attendee], "Already verified attendance");
        require(eventManager.hasCapacity(eventId), "Event at maximum capacity");

        _recordAttendance(
            attendee,
            eventId,
            VerificationMethod.MANUAL,
            msg.sender,
            notes,
            metadataURI
        );
    }

    /**
     * @dev Generate QR code secret for an event
     * @param eventId ID of the event
     * @param secret Secret string for QR code
     * @param expiryDuration Duration in seconds for QR code validity
     */
    function generateQRCode(
        uint256 eventId,
        string memory secret,
        uint256 expiryDuration
    ) external onlyOrganizerOrAdmin {
        require(bytes(secret).length > 0, "Secret cannot be empty");
        require(expiryDuration > 0, "Invalid expiry duration");
        
        EventManager.Event memory eventData = eventManager.getEvent(eventId);
        require(eventData.isActive, "Event is not active");
        
        eventQRSecrets[eventId] = secret;
        qrCodeExpiry[eventId] = block.timestamp + expiryDuration;
        
        string memory qrCodeHash = string(abi.encodePacked(eventId, secret));
        emit QRCodeGenerated(eventId, qrCodeHash, qrCodeExpiry[eventId]);
    }

    /**
     * @dev Internal function to record attendance and mint badge
     * @param attendee Address of the attendee
     * @param eventId ID of the event
     * @param method Verification method used
     * @param verifiedBy Address of the verifier
     * @param proofData Proof data (signature, QR secret, notes)
     * @param metadataURI Metadata URI for the badge
     */
    function _recordAttendance(
        address attendee,
        uint256 eventId,
        VerificationMethod method,
        address verifiedBy,
        string memory proofData,
        string memory metadataURI
    ) internal {
        // Record attendance
        attendanceRecords[eventId][attendee] = AttendanceRecord({
            attendee: attendee,
            eventId: eventId,
            timestamp: block.timestamp,
            method: method,
            verifiedBy: verifiedBy,
            proofData: proofData,
            badgeMinted: false,
            tokenId: 0
        });

        eventAttendees[eventId].push(attendee);
        hasAttended[eventId][attendee] = true;

        // Increment event attendee count
        eventManager.incrementAttendeeCount(eventId);

        emit AttendanceVerified(attendee, eventId, method, verifiedBy);

        // Mint badge
        _mintBadge(attendee, eventId, metadataURI);
    }

    /**
     * @dev Internal function to mint badge
     * @param attendee Address of the attendee
     * @param eventId ID of the event
     * @param metadataURI Metadata URI for the badge
     */
    function _mintBadge(
        address attendee,
        uint256 eventId,
        string memory metadataURI
    ) internal {
        uint256 tokenId = badgeNFT.mintBadge(attendee, eventId, metadataURI);
        
        attendanceRecords[eventId][attendee].badgeMinted = true;
        attendanceRecords[eventId][attendee].tokenId = tokenId;

        emit BadgeIssued(attendee, eventId, tokenId);
    }

    /**
     * @dev Revoke attendance (admin only)
     * @param attendee Address of the attendee
     * @param eventId ID of the event
     * @param reason Reason for revocation
     */
    function revokeAttendance(
        address attendee,
        uint256 eventId,
        string memory reason
    ) external onlyOrganizerOrAdmin {
        require(hasAttended[eventId][attendee], "Attendance not recorded");
        require(bytes(reason).length > 0, "Reason cannot be empty");

        AttendanceRecord storage record = attendanceRecords[eventId][attendee];
        
        // Revoke badge if minted
        if (record.badgeMinted && record.tokenId > 0) {
            badgeNFT.revokeBadge(record.tokenId, reason);
        }

        // Mark attendance as revoked
        hasAttended[eventId][attendee] = false;

        emit AttendanceRevoked(attendee, eventId, msg.sender, reason);
    }

    /**
     * @dev Get attendance record
     * @param eventId ID of the event
     * @param attendee Address of the attendee
     * @return AttendanceRecord struct
     */
    function getAttendanceRecord(
        uint256 eventId,
        address attendee
    ) external view returns (AttendanceRecord memory) {
        return attendanceRecords[eventId][attendee];
    }

    /**
     * @dev Get all attendees for an event
     * @param eventId ID of the event
     * @return Array of attendee addresses
     */
    function getEventAttendees(uint256 eventId) external view returns (address[] memory) {
        return eventAttendees[eventId];
    }

    /**
     * @dev Get event attendance count
     * @param eventId ID of the event
     * @return Number of verified attendees
     */
    function getAttendanceCount(uint256 eventId) external view returns (uint256) {
        return eventAttendees[eventId].length;
    }

    /**
     * @dev Check if QR code is valid for an event
     * @param eventId ID of the event
     * @return bool True if QR code exists and is not expired
     */
    function isQRCodeValid(uint256 eventId) external view returns (bool) {
        return bytes(eventQRSecrets[eventId]).length > 0 && 
               block.timestamp <= qrCodeExpiry[eventId];
    }

    /**
     * @dev Batch verify attendance for multiple attendees
     * @param attendees Array of attendee addresses
     * @param eventId ID of the event
     * @param metadataURIs Array of metadata URIs
     * @param notes Verification notes
     */
    function batchVerifyAttendance(
        address[] calldata attendees,
        uint256 eventId,
        string[] calldata metadataURIs,
        string memory notes
    ) external onlyVerifier eventActive(eventId) whenNotPaused nonReentrant {
        require(attendees.length == metadataURIs.length, "Arrays length mismatch");
        require(attendees.length > 0, "Empty arrays");

        for (uint256 i = 0; i < attendees.length; i++) {
            if (!hasAttended[eventId][attendees[i]]) {
                _recordAttendance(
                    attendees[i],
                    eventId,
                    VerificationMethod.MANUAL,
                    msg.sender,
                    notes,
                    metadataURIs[i]
                );
            }
        }
    }

    /**
     * @dev Emergency pause (admin only)
     */
    function pause() external {
        require(
            accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Not authorized: requires admin role"
        );
        _pause();
    }

    /**
     * @dev Unpause (admin only)
     */
    function unpause() external {
        require(
            accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Not authorized: requires admin role"
        );
        _unpause();
    }
}

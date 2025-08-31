import { usePublicClient, useWalletClient, useAccount, readContracts, useContractWrite, useWaitForTransaction } from 'wagmi';
import { useCallback, useMemo } from 'react';
import { Contract, Interface } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/utils/constants';
import { toast } from 'react-toastify';

// Import contract ABIs (these would typically be imported from generated types)
// For now, we'll define minimal ABIs for the main functions
const ACCESS_CONTROL_ABI = [
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function isOrganizer(address account) external view returns (bool)',
  'function isVerifier(address account) external view returns (bool)',
  'function isAdmin(address account) external view returns (bool)',
  'function addOrganizer(address organizer) external',
  'function removeOrganizer(address organizer) external',
  'function addVerifier(address verifier) external',
  'function removeVerifier(address verifier) external',
];

export const EVENT_MANAGER_ABI = [
  'function getTotalEvents() external view returns (uint256)',
  'function getEvent(uint256 eventId) external view returns (tuple(uint256 eventId, string title, string description, string metadataURI, uint256 timestamp, uint256 endTimestamp, uint256 maxAttendees, uint256 currentAttendees, string location, string category, address organizer, bool active, uint256 createdTimestamp, string reasonForDeactivation) eventData)',
  'function getOrganizerEvents(address organizer) external view returns (uint256[] eventIds)',
  'function createEvent(string calldata title, string calldata description, string calldata metadataURI, uint256 timestamp, uint256 endTimestamp, uint256 maxAttendees, string calldata location, string calldata category) external',
  'function updateEvent(uint256 eventId, string calldata title, string calldata description, uint256 timestamp, uint256 endTimestamp, uint256 maxAttendees, string calldata location, string calldata category) external',
  'function deactivateEvent(uint256 eventId, string calldata reason) external',
  'function activateEvent(uint256 eventId) external',
  'function incrementAttendeeCount(uint256 eventId) external',
];

export const BADGE_NFT_ABI = [
  'event BadgeIssued(address indexed recipient, uint256 indexed eventId, uint256 indexed tokenId, string metadataURI)',
  'function getBadge(uint256 tokenId) external view returns (tuple(uint256 tokenId, uint256 eventId, address owner, string metadataURI, uint256 issuedTimestamp, bool revoked, string reasonForRevocation) badgeData)',
  'function getUserBadges(address user) external view returns (uint256[] tokenIds)',
  'function getUserActiveBadges(address user) external view returns (uint256[] tokenIds)',
  'function getUserStats(address user) external view returns (uint256 totalBadges, uint256 activeBadges)',
  'function hasAttended(uint256 eventId, address user) external view returns (bool)',
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function mintBadge(address recipient, uint256 eventId, string memory metadataURI) external',
  'function revokeBadge(uint256 tokenId, string memory reason) external',
  'function batchMintBadges(address[] calldata recipients, uint256 eventId, string[] calldata metadataURIs) external',
];

export const ATTENDANCE_ABI = [
  'function getAttendanceRecord(uint256 eventId, address attendee) external view returns (tuple(uint256 eventId, address attendee, uint256 timestamp, string signature, string metadataURI, bool verified, bool revoked, string reasonForRevocation) attendanceRecord)',
  'function getEventAttendees(uint256 eventId) external view returns (address[] attendees)',
  'function getAttendanceCount(uint256 eventId) external view returns (uint256)',
  'function isQRCodeValid(uint256 eventId) external view returns (bool)',
  'function verifyAttendanceByQR(uint256 eventId, string memory qrSecret, string memory metadataURI) external',
  'function verifyAttendanceBySignature(uint256 eventId, bytes memory signature, string memory metadataURI) external',
  'function verifyAttendanceManually(address attendee, uint256 eventId, string memory notes, string memory metadataURI) external',
  'function generateQRCode(uint256 eventId, string memory secret, uint256 expiryDuration) external',
  'function revokeAttendance(address attendee, uint256 eventId, string memory reason) external',
  'function batchVerifyAttendance(address[] calldata attendees, uint256 eventId, string[] calldata metadataURIs, string memory notes) external',
];

// Helper hook to get contract instances
function useContracts() {
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();

  const accessControl = useMemo(() => {
    if (!CONTRACT_ADDRESSES.ACCESS_CONTROL || !publicClient || !walletClient.data) return null;
    return {
      address: CONTRACT_ADDRESSES.ACCESS_CONTROL as `0x${string}`,
    abi: ACCESS_CONTROL_ABI,
    };
  }, [publicClient, walletClient.data]);

  const eventManager = useMemo(() => {
    if (!CONTRACT_ADDRESSES.EVENT_MANAGER || !publicClient || !walletClient.data) return null;
    return {
      address: CONTRACT_ADDRESSES.EVENT_MANAGER as `0x${string}`,
    abi: EVENT_MANAGER_ABI,
    };
  }, [publicClient, walletClient.data]);

  const badgeNFT = useMemo(() => {
    if (!CONTRACT_ADDRESSES.BADGE_NFT || !publicClient || !walletClient.data) return null;
    return {
      address: CONTRACT_ADDRESSES.BADGE_NFT as `0x${string}`,
    abi: BADGE_NFT_ABI,
    };
  }, [publicClient, walletClient.data]);

  const attendance = useMemo(() => {
    if (!CONTRACT_ADDRESSES.ATTENDANCE || !publicClient || !walletClient.data) return null;
    return {
      address: CONTRACT_ADDRESSES.ATTENDANCE as `0x${string}`,
    abi: ATTENDANCE_ABI,
    };
  }, [publicClient, walletClient.data]);

  return { accessControl, eventManager, badgeNFT, attendance };
}

interface UseContractReadHook {
  data: any;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook for AccessControl contract interactions
 */
export function useAccessControl() {
  const { accessControl } = useContracts();
  const { address } = useAccount();

  // Read functions
  const { data: isAdmin, isLoading: isAdminLoading, error: isAdminError } = readContracts({
    contracts: [
      {
        address: accessControl?.address,
        abi: accessControl?.abi || [],
        functionName: 'isAdmin',
        args: address ? [address] : [],
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  const { data: isOrganizer, isLoading: isOrganizerLoading, error: isOrganizerError } = readContracts({
    contracts: [
      {
        address: accessControl?.address,
        abi: accessControl?.abi || [],
        functionName: 'isOrganizer',
        args: address ? [address] : [],
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  const { data: isVerifier, isLoading: isVerifierLoading, error: isVerifierError } = readContracts({
    contracts: [
      {
        address: accessControl?.address,
        abi: accessControl?.abi || [],
        functionName: 'isVerifier',
        args: address ? [address] : [],
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  // Write functions
  const { data: addOrganizerResult, write: addOrganizerWrite, isLoading: addOrganizerLoading, isSuccess: addOrganizerSuccess, isError: addOrganizerError, error: addOrganizerTxError } = useContractWrite({
    address: accessControl?.address,
    abi: accessControl?.abi || [],
    functionName: 'addOrganizer',
  });
  const { isLoading: addOrganizerWaiting, isSuccess: addOrganizerConfirmed } = useWaitForTransaction({ hash: addOrganizerResult });

  const addOrganizer = useCallback(async (organizerAddress: string) => {
    if (!accessControl?.address || !accessControl?.abi) throw new Error('AccessControl contract not available');
    return addOrganizerWrite({ args: [organizerAddress] });
  }, [accessControl, addOrganizerWrite]);

  const { data: removeOrganizerResult, write: removeOrganizerWrite, isLoading: removeOrganizerLoading, isSuccess: removeOrganizerSuccess, isError: removeOrganizerError, error: removeOrganizerTxError } = useContractWrite({
    address: accessControl?.address,
    abi: accessControl?.abi || [],
    functionName: 'removeOrganizer',
  });
  const { isLoading: removeOrganizerWaiting, isSuccess: removeOrganizerConfirmed } = useWaitForTransaction({ hash: removeOrganizerResult });

  const removeOrganizer = useCallback(async (organizerAddress: string) => {
    if (!accessControl?.address || !accessControl?.abi) throw new Error('AccessControl contract not available');
    return removeOrganizerWrite({ args: [organizerAddress] });
  }, [accessControl, removeOrganizerWrite]);

  const { data: addVerifierResult, write: addVerifierWrite, isLoading: addVerifierLoading, isSuccess: addVerifierSuccess, isError: addVerifierError, error: addVerifierTxError } = useContractWrite({
    address: accessControl?.address,
    abi: accessControl?.abi || [],
    functionName: 'addVerifier',
  });
  const { isLoading: addVerifierWaiting, isSuccess: addVerifierConfirmed } = useWaitForTransaction({ hash: addVerifierResult });

  const addVerifier = useCallback(async (verifierAddress: string) => {
    if (!accessControl?.address || !accessControl?.abi) throw new Error('AccessControl contract not available');
    return addVerifierWrite({ args: [verifierAddress] });
  }, [accessControl, addVerifierWrite]);

  const { data: removeVerifierResult, write: removeVerifierWrite, isLoading: removeVerifierLoading, isSuccess: removeVerifierSuccess, isError: removeVerifierError, error: removeVerifierTxError } = useContractWrite({
    address: accessControl?.address,
    abi: accessControl?.abi || [],
    functionName: 'removeVerifier',
  });
  const { isLoading: removeVerifierWaiting, isSuccess: removeVerifierConfirmed } = useWaitForTransaction({ hash: removeVerifierResult });

  const removeVerifier = useCallback(async (verifierAddress: string) => {
    if (!accessControl?.address || !accessControl?.abi) throw new Error('AccessControl contract not available');
    return removeVerifierWrite({ args: [verifierAddress] });
  }, [accessControl, removeVerifierWrite]);

  return {
    contract: accessControl,
    isAdmin: isAdmin as boolean,
    isOrganizer: isOrganizer as boolean,
    isVerifier: isVerifier as boolean,
    addOrganizer,
    removeOrganizer,
    addVerifier,
    removeVerifier,
    addOrganizerLoading,
    addOrganizerSuccess,
    addOrganizerError,
    addOrganizerTxError,
    addOrganizerWaiting,
    addOrganizerConfirmed,
    removeOrganizerLoading,
    removeOrganizerSuccess,
    removeOrganizerError,
    removeOrganizerTxError,
    removeOrganizerWaiting,
    removeOrganizerConfirmed,
    addVerifierLoading,
    addVerifierSuccess,
    addVerifierError,
    addVerifierTxError,
    addVerifierWaiting,
    addVerifierConfirmed,
    removeVerifierLoading,
    removeVerifierSuccess,
    removeVerifierError,
    removeVerifierTxError,
    removeVerifierWaiting,
    removeVerifierConfirmed,
  };
}

/**
 * Hook for EventManager contract interactions
 */
export function useEventManager() {
  const { eventManager } = useContracts();
  const { address } = useAccount();

  // Read functions
  const { data: totalEvents, isLoading: totalEventsLoading } = readContracts({
    contracts: [
      {
        address: eventManager?.address,
        abi: eventManager?.abi || [],
        functionName: 'getTotalEvents',
        args: [],
      },
    ],
    query: {
      enabled: !!eventManager?.address,
    },
  });

  const getEvent = useCallback((eventId: number): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: eventManager?.address,
          abi: eventManager?.abi || [],
          functionName: 'getEvent',
          args: [BigInt(eventId)],
        },
      ],
      query: {
        enabled: !!eventManager?.address && eventId != null,
      },
    });
    return { data, isLoading, isError, error };
  }, [eventManager]);

  const getOrganizerEvents = useCallback((organizerAddress: string): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: eventManager?.address,
          abi: eventManager?.abi || [],
          functionName: 'getOrganizerEvents',
          args: [organizerAddress],
        },
      ],
      query: {
        enabled: !!eventManager?.address && !!organizerAddress,
      },
    });
    return { data, isLoading, isError, error };
  }, [eventManager]);

  // Write functions
  const { data: createEventResult, write: createEventWrite, isLoading: createEventLoading, isSuccess: createEventSuccess, isError: createEventError, error: createEventTxError } = useContractWrite({
    address: eventManager?.address,
    abi: eventManager?.abi || [],
    functionName: 'createEvent',
  });
  const { isLoading: createEventWaiting, isSuccess: createEventConfirmed } = useWaitForTransaction({ hash: createEventResult });

  const createEvent = useCallback(async (eventData: {
    title: string;
    description: string;
    metadataURI: string;
    timestamp: number;
    endTimestamp: number;
    maxAttendees: number;
    location: string;
    category: string;
  }) => {
    if (!eventManager?.address || !eventManager?.abi) throw new Error('EventManager contract not available');
    return createEventWrite({
      args: [
      eventData.title,
      eventData.description,
      eventData.metadataURI,
        BigInt(eventData.timestamp),
        BigInt(eventData.endTimestamp),
        BigInt(eventData.maxAttendees),
      eventData.location,
        eventData.category,
      ],
    });
  }, [eventManager, createEventWrite]);

  const { data: updateEventResult, write: updateEventWrite, isLoading: updateEventLoading, isSuccess: updateEventSuccess, isError: updateEventError, error: updateEventTxError } = useContractWrite({
    address: eventManager?.address,
    abi: eventManager?.abi || [],
    functionName: 'updateEvent',
  });
  const { isLoading: updateEventWaiting, isSuccess: updateEventConfirmed } = useWaitForTransaction({ hash: updateEventResult });

  const updateEvent = useCallback(async (eventId: number, eventData: {
    title: string;
    description: string;
    timestamp: number;
    endTimestamp: number;
    maxAttendees: number;
    location: string;
    category: string;
  }) => {
    if (!eventManager?.address || !eventManager?.abi) throw new Error('EventManager contract not available');
    return updateEventWrite({
      args: [
        BigInt(eventId),
      eventData.title,
      eventData.description,
        BigInt(eventData.timestamp),
        BigInt(eventData.endTimestamp),
        BigInt(eventData.maxAttendees),
      eventData.location,
        eventData.category,
      ],
    });
  }, [eventManager, updateEventWrite]);

  const { data: deactivateEventResult, write: deactivateEventWrite, isLoading: deactivateEventLoading, isSuccess: deactivateEventSuccess, isError: deactivateEventError, error: deactivateEventTxError } = useContractWrite({
    address: eventManager?.address,
    abi: eventManager?.abi || [],
    functionName: 'deactivateEvent',
  });
  const { isLoading: deactivateEventWaiting, isSuccess: deactivateEventConfirmed } = useWaitForTransaction({ hash: deactivateEventResult });

  const deactivateEvent = useCallback(async (eventId: number, reason: string) => {
    if (!eventManager?.address || !eventManager?.abi) throw new Error('EventManager contract not available');
    return deactivateEventWrite({ args: [BigInt(eventId), reason] });
  }, [eventManager, deactivateEventWrite]);

  const { data: activateEventResult, write: activateEventWrite, isLoading: activateEventLoading, isSuccess: activateEventSuccess, isError: activateEventError, error: activateEventTxError } = useContractWrite({
    address: eventManager?.address,
    abi: eventManager?.abi || [],
    functionName: 'activateEvent',
  });
  const { isLoading: activateEventWaiting, isSuccess: activateEventConfirmed } = useWaitForTransaction({ hash: activateEventResult });

  const activateEvent = useCallback(async (eventId: number) => {
    if (!eventManager?.address || !eventManager?.abi) throw new Error('EventManager contract not available');
    return activateEventWrite({ args: [BigInt(eventId)] });
  }, [eventManager, activateEventWrite]);

  const { data: incrementAttendeeCountResult, write: incrementAttendeeCountWrite, isLoading: incrementAttendeeCountLoading, isSuccess: incrementAttendeeCountSuccess, isError: incrementAttendeeCountError, error: incrementAttendeeCountTxError } = useContractWrite({
    address: eventManager?.address,
    abi: eventManager?.abi || [],
    functionName: 'incrementAttendeeCount',
  });
  const { isLoading: incrementAttendeeCountWaiting, isSuccess: incrementAttendeeCountConfirmed } = useWaitForTransaction({ hash: incrementAttendeeCountResult });

  const incrementAttendeeCount = useCallback(async (eventId: number) => {
    if (!eventManager?.address || !eventManager?.abi) throw new Error('EventManager contract not available');
    return incrementAttendeeCountWrite({ args: [BigInt(eventId)] });
  }, [eventManager, incrementAttendeeCountWrite]);

  return {
    contract: eventManager,
    createEvent,
    updateEvent,
    getEvent,
    getOrganizerEvents,
    getTotalEvents: totalEvents as bigint,
    totalEventsLoading,
    deactivateEvent,
    activateEvent,
    incrementAttendeeCount,
    createEventLoading,
    createEventSuccess,
    createEventError,
    createEventTxError,
    createEventWaiting,
    createEventConfirmed,
    updateEventLoading,
    updateEventSuccess,
    updateEventError,
    updateEventTxError,
    updateEventWaiting,
    updateEventConfirmed,
    deactivateEventLoading,
    deactivateEventSuccess,
    deactivateEventError,
    deactivateEventTxError,
    deactivateEventWaiting,
    deactivateEventConfirmed,
    activateEventLoading,
    activateEventSuccess,
    activateEventError,
    activateEventTxError,
    activateEventWaiting,
    activateEventConfirmed,
    incrementAttendeeCountLoading,
    incrementAttendeeCountSuccess,
    incrementAttendeeCountError,
    incrementAttendeeCountTxError,
    incrementAttendeeCountWaiting,
    incrementAttendeeCountConfirmed,
  };
}

/**
 * Hook for BadgeNFT contract interactions
 */
export function useBadgeNFT() {
  const { badgeNFT } = useContracts();
  const { address } = useAccount();

  // Read functions
  const getBadge = useCallback((tokenId: number): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: badgeNFT?.address,
          abi: badgeNFT?.abi || [],
          functionName: 'getBadge',
          args: [BigInt(tokenId)],
        },
      ],
      query: {
        enabled: !!badgeNFT?.address && tokenId != null,
      },
    });
    return { data, isLoading, isError, error };
  }, [badgeNFT]);

  const getUserBadges = useCallback((userAddress: string): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: badgeNFT?.address,
          abi: badgeNFT?.abi || [],
          functionName: 'getUserBadges',
          args: [userAddress],
        },
      ],
      query: {
        enabled: !!badgeNFT?.address && !!userAddress,
      },
    });
    return { data, isLoading, isError, error };
  }, [badgeNFT]);

  const getUserActiveBadges = useCallback((userAddress: string): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: badgeNFT?.address,
          abi: badgeNFT?.abi || [],
          functionName: 'getUserActiveBadges',
          args: [userAddress],
        },
      ],
      query: {
        enabled: !!badgeNFT?.address && !!userAddress,
      },
    });
    return { data, isLoading, isError, error };
  }, [badgeNFT]);

  const getUserStats = useCallback((userAddress: string): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: badgeNFT?.address,
          abi: badgeNFT?.abi || [],
          functionName: 'getUserStats',
          args: [userAddress],
        },
      ],
      query: {
        enabled: !!badgeNFT?.address && !!userAddress,
      },
    });
    return { data, isLoading, isError, error };
  }, [badgeNFT]);

  const hasAttended = useCallback((eventId: number, userAddress: string): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: badgeNFT?.address,
          abi: badgeNFT?.abi || [],
          functionName: 'hasAttended',
          args: [BigInt(eventId), userAddress],
        },
      ],
      query: {
        enabled: !!badgeNFT?.address && eventId != null && !!userAddress,
      },
    });
    return { data, isLoading, isError, error };
  }, [badgeNFT]);

  const getTokenURI = useCallback((tokenId: number): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: badgeNFT?.address,
          abi: badgeNFT?.abi || [],
          functionName: 'tokenURI',
          args: [BigInt(tokenId)],
        },
      ],
      query: {
        enabled: !!badgeNFT?.address && tokenId != null,
      },
    });
    return { data, isLoading, isError, error };
  }, [badgeNFT]);

  const getTotalBadges = useCallback((): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: badgeNFT?.address,
          abi: badgeNFT?.abi || [],
          functionName: 'getTotalBadges',
          args: [],
        },
      ],
      query: {
        enabled: !!badgeNFT?.address,
      },
    });
    return { data, isLoading, isError, error };
  }, [badgeNFT]);

  // Write functions
  const { data: mintBadgeResult, write: mintBadgeWrite, isLoading: mintBadgeLoading, isSuccess: mintBadgeSuccess, isError: mintBadgeError, error: mintBadgeTxError } = useContractWrite({
    address: badgeNFT?.address,
    abi: badgeNFT?.abi || [],
    functionName: 'mintBadge',
  });
  const { isLoading: mintBadgeWaiting, isSuccess: mintBadgeConfirmed } = useWaitForTransaction({ hash: mintBadgeResult });

  const mintBadge = useCallback(async (attendee: string, eventId: number, metadataURI: string) => {
    if (!badgeNFT?.address || !badgeNFT?.abi) throw new Error('BadgeNFT contract not available');
    return mintBadgeWrite({ args: [attendee, BigInt(eventId), metadataURI] });
  }, [badgeNFT, mintBadgeWrite]);

  const { data: revokeBadgeResult, write: revokeBadgeWrite, isLoading: revokeBadgeLoading, isSuccess: revokeBadgeSuccess, isError: revokeBadgeError, error: revokeBadgeTxError } = useContractWrite({
    address: badgeNFT?.address,
    abi: badgeNFT?.abi || [],
    functionName: 'revokeBadge',
  });
  const { isLoading: revokeBadgeWaiting, isSuccess: revokeBadgeConfirmed } = useWaitForTransaction({ hash: revokeBadgeResult });

  const revokeBadge = useCallback(async (tokenId: number, reason: string) => {
    if (!badgeNFT?.address || !badgeNFT?.abi) throw new Error('BadgeNFT contract not available');
    return revokeBadgeWrite({ args: [BigInt(tokenId), reason] });
  }, [badgeNFT, revokeBadgeWrite]);

  const { data: batchMintBadgesResult, write: batchMintBadgesWrite, isLoading: batchMintBadgesLoading, isSuccess: batchMintBadgesSuccess, isError: batchMintBadgesError, error: batchMintBadgesTxError } = useContractWrite({
    address: badgeNFT?.address,
    abi: badgeNFT?.abi || [],
    functionName: 'batchMintBadges',
  });
  const { isLoading: batchMintBadgesWaiting, isSuccess: batchMintBadgesConfirmed } = useWaitForTransaction({ hash: batchMintBadgesResult });

  const batchMintBadges = useCallback(async (attendees: string[], eventId: number, metadataURIs: string[]) => {
    if (!badgeNFT?.address || !badgeNFT?.abi) throw new Error('BadgeNFT contract not available');
    return batchMintBadgesWrite({ args: [attendees, BigInt(eventId), metadataURIs] });
  }, [badgeNFT, batchMintBadgesWrite]);

  return {
    contract: badgeNFT,
    mintBadge,
    getBadge,
    getUserBadges,
    getUserActiveBadges,
    getUserStats,
    hasAttended,
    revokeBadge,
    getTokenURI,
    getTotalBadges,
    batchMintBadges,
    mintBadgeLoading,
    mintBadgeSuccess,
    mintBadgeError,
    mintBadgeTxError,
    mintBadgeWaiting,
    mintBadgeConfirmed,
    revokeBadgeLoading,
    revokeBadgeSuccess,
    revokeBadgeError,
    revokeBadgeTxError,
    revokeBadgeWaiting,
    revokeBadgeConfirmed,
    batchMintBadgesLoading,
    batchMintBadgesSuccess,
    batchMintBadgesError,
    batchMintBadgesTxError,
    batchMintBadgesWaiting,
    batchMintBadgesConfirmed,
  };
}

/**
 * Hook for Attendance contract interactions
 */
export function useAttendance() {
  const { attendance } = useContracts();
  const { address } = useAccount();

  // Read functions
  const getAttendanceRecord = useCallback((eventId: number, attendeeAddress: string): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: attendance?.address,
          abi: attendance?.abi || [],
          functionName: 'getAttendanceRecord',
          args: [BigInt(eventId), attendeeAddress],
        },
      ],
      query: {
        enabled: !!attendance?.address && eventId != null && !!attendeeAddress,
      },
    });
    return { data, isLoading, isError, error };
  }, [attendance]);

  const getEventAttendees = useCallback((eventId: number): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: attendance?.address,
          abi: attendance?.abi || [],
          functionName: 'getEventAttendees',
          args: [BigInt(eventId)],
        },
      ],
      query: {
        enabled: !!attendance?.address && eventId != null,
      },
    });
    return { data, isLoading, isError, error };
  }, [attendance]);

  const getAttendanceCount = useCallback((eventId: number): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: attendance?.address,
          abi: attendance?.abi || [],
          functionName: 'getAttendanceCount',
          args: [BigInt(eventId)],
        },
      ],
      query: {
        enabled: !!attendance?.address && eventId != null,
      },
    });
    return { data, isLoading, isError, error };
  }, [attendance]);

  const isQRCodeValid = useCallback((eventId: number): UseContractReadHook => {
    const { data, isLoading, isError, error } = readContracts({
      contracts: [
        {
          address: attendance?.address,
          abi: attendance?.abi || [],
          functionName: 'isQRCodeValid',
          args: [BigInt(eventId)],
        },
      ],
      query: {
        enabled: !!attendance?.address && eventId != null,
      },
    });
    return { data, isLoading, isError, error };
  }, [attendance]);

  // Write functions
  const { data: verifyAttendanceByQRResult, write: verifyAttendanceByQRWrite, isLoading: verifyAttendanceByQRLoading, isSuccess: verifyAttendanceByQRSuccess, isError: verifyAttendanceByQRError, error: verifyAttendanceByQRTxError } = useContractWrite({
    address: attendance?.address,
    abi: attendance?.abi || [],
    functionName: 'verifyAttendanceByQR',
  });
  const { isLoading: verifyAttendanceByQRWaiting, isSuccess: verifyAttendanceByQRConfirmed } = useWaitForTransaction({ hash: verifyAttendanceByQRResult });

  const verifyAttendanceByQR = useCallback(async (eventId: number, qrSecret: string, metadataURI: string) => {
    if (!attendance?.address || !attendance?.abi) throw new Error('Attendance contract not available');
    return verifyAttendanceByQRWrite({ args: [BigInt(eventId), qrSecret, metadataURI] });
  }, [attendance, verifyAttendanceByQRWrite]);

  const { data: verifyAttendanceBySignatureResult, write: verifyAttendanceBySignatureWrite, isLoading: verifyAttendanceBySignatureLoading, isSuccess: verifyAttendanceBySignatureSuccess, isError: verifyAttendanceBySignatureError, error: verifyAttendanceBySignatureTxError } = useContractWrite({
    address: attendance?.address,
    abi: attendance?.abi || [],
    functionName: 'verifyAttendanceBySignature',
  });
  const { isLoading: verifyAttendanceBySignatureWaiting, isSuccess: verifyAttendanceBySignatureConfirmed } = useWaitForTransaction({ hash: verifyAttendanceBySignatureResult });

  const verifyAttendanceBySignature = useCallback(async (eventId: number, signature: `0x${string}`, metadataURI: string) => {
    if (!attendance?.address || !attendance?.abi) throw new Error('Attendance contract not available');
    return verifyAttendanceBySignatureWrite({ args: [BigInt(eventId), signature, metadataURI] });
  }, [attendance, verifyAttendanceBySignatureWrite]);

  const { data: verifyAttendanceManuallyResult, write: verifyAttendanceManuallyWrite, isLoading: verifyAttendanceManuallyLoading, isSuccess: verifyAttendanceManuallySuccess, isError: verifyAttendanceManuallyError, error: verifyAttendanceManuallyTxError } = useContractWrite({
    address: attendance?.address,
    abi: attendance?.abi || [],
    functionName: 'verifyAttendanceManually',
  });
  const { isLoading: verifyAttendanceManuallyWaiting, isSuccess: verifyAttendanceManuallyConfirmed } = useWaitForTransaction({ hash: verifyAttendanceManuallyResult });

  const verifyAttendanceManually = useCallback(async (attendee: string, eventId: number, notes: string, metadataURI: string) => {
    if (!attendance?.address || !attendance?.abi) throw new Error('Attendance contract not available');
    return verifyAttendanceManuallyWrite({ args: [attendee, BigInt(eventId), notes, metadataURI] });
  }, [attendance, verifyAttendanceManuallyWrite]);

  const { data: generateQRCodeResult, write: generateQRCodeWrite, isLoading: generateQRCodeLoading, isSuccess: generateQRCodeSuccess, isError: generateQRCodeError, error: generateQRCodeTxError } = useContractWrite({
    address: attendance?.address,
    abi: attendance?.abi || [],
    functionName: 'generateQRCode',
  });
  const { isLoading: generateQRCodeWaiting, isSuccess: generateQRCodeConfirmed } = useWaitForTransaction({ hash: generateQRCodeResult });

  const generateQRCode = useCallback(async (eventId: number, secret: string, expiryDuration: number) => {
    if (!attendance?.address || !attendance?.abi) throw new Error('Attendance contract not available');
    return generateQRCodeWrite({ args: [BigInt(eventId), secret, BigInt(expiryDuration)] });
  }, [attendance, generateQRCodeWrite]);

  const { data: revokeAttendanceResult, write: revokeAttendanceWrite, isLoading: revokeAttendanceLoading, isSuccess: revokeAttendanceSuccess, isError: revokeAttendanceError, error: revokeAttendanceTxError } = useContractWrite({
    address: attendance?.address,
    abi: attendance?.abi || [],
    functionName: 'revokeAttendance',
  });
  const { isLoading: revokeAttendanceWaiting, isSuccess: revokeAttendanceConfirmed } = useWaitForTransaction({ hash: revokeAttendanceResult });

  const revokeAttendance = useCallback(async (attendee: string, eventId: number, reason: string) => {
    if (!attendance?.address || !attendance?.abi) throw new Error('Attendance contract not available');
    return revokeAttendanceWrite({ args: [attendee, BigInt(eventId), reason] });
  }, [attendance, revokeAttendanceWrite]);

  const { data: batchVerifyAttendanceResult, write: batchVerifyAttendanceWrite, isLoading: batchVerifyAttendanceLoading, isSuccess: batchVerifyAttendanceSuccess, isError: batchVerifyAttendanceError, error: batchVerifyAttendanceTxError } = useContractWrite({
    address: attendance?.address,
    abi: attendance?.abi || [],
    functionName: 'batchVerifyAttendance',
  });
  const { isLoading: batchVerifyAttendanceWaiting, isSuccess: batchVerifyAttendanceConfirmed } = useWaitForTransaction({ hash: batchVerifyAttendanceResult });

  const batchVerifyAttendance = useCallback(async (attendees: string[], eventId: number, metadataURIs: string[], notes: string) => {
    if (!attendance?.address || !attendance?.abi) throw new Error('Attendance contract not available');
    return batchVerifyAttendanceWrite({ args: [attendees, BigInt(eventId), metadataURIs, notes] });
  }, [attendance, batchVerifyAttendanceWrite]);

  return {
    contract: attendance,
    verifyAttendanceByQR,
    verifyAttendanceBySignature,
    verifyAttendanceManually,
    generateQRCode,
    getAttendanceRecord,
    getEventAttendees,
    getAttendanceCount,
    isQRCodeValid,
    revokeAttendance,
    batchVerifyAttendance,
    verifyAttendanceByQRLoading,
    verifyAttendanceByQRSuccess,
    verifyAttendanceByQRError,
    verifyAttendanceByQRTxError,
    verifyAttendanceByQRWaiting,
    verifyAttendanceByQRConfirmed,
    verifyAttendanceBySignatureLoading,
    verifyAttendanceBySignatureSuccess,
    verifyAttendanceBySignatureError,
    verifyAttendanceBySignatureTxError,
    verifyAttendanceBySignatureWaiting,
    verifyAttendanceBySignatureConfirmed,
    verifyAttendanceManuallyLoading,
    verifyAttendanceManuallySuccess,
    verifyAttendanceManuallyError,
    verifyAttendanceManuallyTxError,
    verifyAttendanceManuallyWaiting,
    verifyAttendanceManuallyConfirmed,
    generateQRCodeLoading,
    generateQRCodeSuccess,
    generateQRCodeError,
    generateQRCodeTxError,
    generateQRCodeWaiting,
    generateQRCodeConfirmed,
    revokeAttendanceLoading,
    revokeAttendanceSuccess,
    revokeAttendanceError,
    revokeAttendanceTxError,
    revokeAttendanceWaiting,
    revokeAttendanceConfirmed,
    batchVerifyAttendanceLoading,
    batchVerifyAttendanceSuccess,
    batchVerifyAttendanceError,
    batchVerifyAttendanceTxError,
    batchVerifyAttendanceWaiting,
    batchVerifyAttendanceConfirmed,
  };
}

/**
 * Hook for getting all contract instances
 */
export function useAllContracts() {
  const accessControl = useAccessControl();
  const eventManager = useEventManager();
  const badgeNFT = useBadgeNFT();
  const attendance = useAttendance();

  return {
    accessControl,
    eventManager,
    badgeNFT,
    attendance,
  };
}

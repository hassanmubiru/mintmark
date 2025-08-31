// Network configuration
export const NETWORKS = {
  BASE_GOERLI: {
    chainId: 84531,
    name: 'Base Goerli',
    rpcUrl: 'https://goerli.base.org',
    blockExplorer: 'https://goerli.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  BASE_MAINNET: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  LOCALHOST: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;

// Contract addresses (to be filled after deployment)
export const CONTRACT_ADDRESSES = {
  ACCESS_CONTROL: process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS || '',
  EVENT_MANAGER: process.env.NEXT_PUBLIC_EVENT_MANAGER_ADDRESS || '',
  BADGE_NFT: process.env.NEXT_PUBLIC_BADGE_NFT_ADDRESS || '',
  ATTENDANCE: process.env.NEXT_PUBLIC_ATTENDANCE_ADDRESS || '',
} as const;

// Application constants
export const APP_CONFIG = {
  NAME: 'MintMark',
  DESCRIPTION: 'Proof-of-Attendance Tracker that issues unique ERC-721 NFTs',
  VERSION: '1.0.0',
  AUTHOR: 'MintMark Team',
  GITHUB_URL: 'https://github.com/mintmark/mintmark',
  DISCORD_URL: 'https://discord.gg/mintmark',
  TWITTER_URL: 'https://twitter.com/mintmark',
  DOCUMENTATION_URL: 'https://docs.mintmark.app',
} as const;

// Role constants matching smart contract
export const ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  ORGANIZER_ROLE: '0x71840dc4906352362b0cdaf79870196c8e42acafade72d5d5a6d59291253ceb1', // keccak256("ORGANIZER_ROLE")
  VERIFIER_ROLE: '0x2f2ff15d38259d74378d86c84a3586c86e8065ee1571b63b20d8f65c5e97b8b7', // keccak256("VERIFIER_ROLE")
} as const;

// Event categories
export const EVENT_CATEGORIES = [
  'Technology',
  'Education',
  'Art',
  'Gaming',
  'Finance',
  'Health',
  'Sports',
  'Music',
  'Networking',
  'Business',
  'Startup',
  'Web3',
  'DeFi',
  'NFT',
  'Metaverse',
  'Other',
] as const;

// Badge rarity levels
export const BADGE_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

export const RARITY_COLORS = {
  [BADGE_RARITY.COMMON]: '#64748b',      // gray
  [BADGE_RARITY.UNCOMMON]: '#22c55e',    // green
  [BADGE_RARITY.RARE]: '#3b82f6',       // blue
  [BADGE_RARITY.EPIC]: '#a855f7',       // purple
  [BADGE_RARITY.LEGENDARY]: '#f59e0b',   // orange
} as const;

// Verification methods
export const VERIFICATION_METHODS = {
  SIGNATURE: 'signature',
  QR_CODE: 'qr_code',
  MANUAL: 'manual',
} as const;

// Event status
export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// UI Constants
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 12,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DEBOUNCE_DELAY: 300, // milliseconds
  TOAST_DURATION: 5000, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
} as const;

// Date and time formats
export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  TIME_ONLY: 'h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_CONNECTION: 'mintmark_wallet_connected',
  USER_PREFERENCES: 'mintmark_user_preferences',
  RECENT_EVENTS: 'mintmark_recent_events',
  CACHE_PREFIX: 'mintmark_cache_',
} as const;

// API endpoints (if using external APIs)
export const API_ENDPOINTS = {
  IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  METADATA_API: '/api/metadata',
  EVENTS_API: '/api/events',
  BADGES_API: '/api/badges',
  UPLOAD_API: '/api/upload',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  IPFS_UPLOAD_FAILED: 'Failed to upload to IPFS. Please try again.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported image format.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  FORM_VALIDATION_ERROR: 'Please check your input and try again.',
  EVENT_NOT_FOUND: 'Event not found',
  BADGE_ALREADY_MINTED: 'Badge has already been minted for this event',
  EVENT_NOT_ACTIVE: 'Event is not currently active',
  QR_CODE_EXPIRED: 'QR code has expired',
  INVALID_QR_CODE: 'Invalid QR code',
  ATTENDANCE_ALREADY_VERIFIED: 'Attendance has already been verified',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed successfully',
  EVENT_CREATED: 'Event created successfully',
  EVENT_UPDATED: 'Event updated successfully',
  ATTENDANCE_VERIFIED: 'Attendance verified successfully',
  BADGE_MINTED: 'Badge minted successfully',
  ROLE_GRANTED: 'Role granted successfully',
  ROLE_REVOKED: 'Role revoked successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  METADATA_UPLOADED: 'Metadata uploaded successfully',
  QR_CODE_GENERATED: 'QR code generated successfully',
} as const;

// Regex patterns
export const REGEX_PATTERNS = {
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  IPFS_CID: /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|B[A-Z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48}|F[0-9A-F]{50})$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DISCORD_INVITE: /^https:\/\/discord\.gg\/[a-zA-Z0-9]+$/,
  TWITTER_HANDLE: /^@?[a-zA-Z0-9_]{1,15}$/,
} as const;

// Gas limits for different operations
export const GAS_LIMITS = {
  CREATE_EVENT: 200000,
  UPDATE_EVENT: 150000,
  MINT_BADGE: 200000,
  VERIFY_ATTENDANCE: 150000,
  GRANT_ROLE: 100000,
  REVOKE_ROLE: 100000,
  BATCH_MINT: 500000,
  DEFAULT: 100000,
} as const;

// Theme configuration
export const THEME = {
  BREAKPOINTS: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  SPACING: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  BORDER_RADIUS: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_BATCH_OPERATIONS: true,
  ENABLE_QR_CODE_VERIFICATION: true,
  ENABLE_SIGNATURE_VERIFICATION: true,
  ENABLE_MANUAL_VERIFICATION: true,
  ENABLE_BADGE_RARITY: true,
  ENABLE_STREAK_TRACKING: true,
  ENABLE_CATEGORY_BADGES: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: false,
  ENABLE_DARK_MODE: true,
} as const;

export type NetworkConfig = typeof NETWORKS[keyof typeof NETWORKS];
export type EventCategory = typeof EVENT_CATEGORIES[number];
export type BadgeRarity = typeof BADGE_RARITY[keyof typeof BADGE_RARITY];
export type VerificationMethod = typeof VERIFICATION_METHODS[keyof typeof VERIFICATION_METHODS];
export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];

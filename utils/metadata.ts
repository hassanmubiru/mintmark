import { uploadJSONToIPFS, IPFSUploadResult } from './ipfs';

// NFT Metadata Standards
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes?: NFTAttribute[];
  background_color?: string;
  youtube_url?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'date' | 'boost_percentage' | 'boost_number';
  max_value?: number;
}

// Event-specific metadata
export interface EventMetadata {
  name: string;
  description: string;
  image: string;
  event_id: string;
  organizer: string;
  location: string;
  category: string;
  start_time: string;
  end_time: string;
  max_attendees?: number;
  tags?: string[];
  external_url?: string;
  requirements?: string[];
}

// Badge-specific metadata
export interface BadgeMetadata extends NFTMetadata {
  event_id: string;
  event_name: string;
  event_date: string;
  attendee_address: string;
  organizer: string;
  verification_method: 'signature' | 'qr_code' | 'manual';
  minted_at: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  streak_count?: number;
  category: string;
  location: string;
}

// Attendance proof metadata
export interface AttendanceProofMetadata {
  attendee: string;
  event_id: string;
  event_name: string;
  timestamp: string;
  verification_method: string;
  proof_data: string;
  organizer: string;
  location: string;
}

/**
 * Create standardized event metadata
 */
export function createEventMetadata(
  eventData: {
    name: string;
    description: string;
    eventId: string;
    organizer: string;
    location: string;
    category: string;
    startTime: Date;
    endTime: Date;
    maxAttendees?: number;
    imageUrl?: string;
    tags?: string[];
    requirements?: string[];
    externalUrl?: string;
  }
): EventMetadata {
  return {
    name: eventData.name,
    description: eventData.description,
    image: eventData.imageUrl || generateDefaultEventImage(eventData.category),
    event_id: eventData.eventId,
    organizer: eventData.organizer,
    location: eventData.location,
    category: eventData.category,
    start_time: eventData.startTime.toISOString(),
    end_time: eventData.endTime.toISOString(),
    max_attendees: eventData.maxAttendees,
    tags: eventData.tags || [],
    external_url: eventData.externalUrl,
    requirements: eventData.requirements || [],
  };
}

/**
 * Create standardized badge metadata for NFT
 */
export function createBadgeMetadata(
  badgeData: {
    eventId: string;
    eventName: string;
    eventDate: Date;
    attendeeAddress: string;
    organizer: string;
    verificationMethod: 'signature' | 'qr_code' | 'manual';
    category: string;
    location: string;
    imageUrl?: string;
    description?: string;
    streakCount?: number;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    externalUrl?: string;
  }
): BadgeMetadata {
  const badgeName = `${badgeData.eventName} Attendance Badge`;
  const defaultDescription = `Proof of attendance for ${badgeData.eventName} held on ${badgeData.eventDate.toLocaleDateString()}. This NFT badge certifies that ${badgeData.attendeeAddress} attended this event.`;

  const attributes: NFTAttribute[] = [
    {
      trait_type: 'Event',
      value: badgeData.eventName,
    },
    {
      trait_type: 'Event Date',
      value: badgeData.eventDate.toISOString(),
      display_type: 'date',
    },
    {
      trait_type: 'Category',
      value: badgeData.category,
    },
    {
      trait_type: 'Location',
      value: badgeData.location,
    },
    {
      trait_type: 'Organizer',
      value: badgeData.organizer,
    },
    {
      trait_type: 'Verification Method',
      value: badgeData.verificationMethod,
    },
    {
      trait_type: 'Minted At',
      value: new Date().toISOString(),
      display_type: 'date',
    },
  ];

  if (badgeData.rarity) {
    attributes.push({
      trait_type: 'Rarity',
      value: badgeData.rarity,
    });
  }

  if (badgeData.streakCount !== undefined) {
    attributes.push({
      trait_type: 'Streak Count',
      value: badgeData.streakCount,
      display_type: 'number',
    });
  }

  return {
    name: badgeName,
    description: badgeData.description || defaultDescription,
    image: badgeData.imageUrl || generateDefaultBadgeImage(badgeData.category, badgeData.rarity),
    external_url: badgeData.externalUrl,
    attributes,
    event_id: badgeData.eventId,
    event_name: badgeData.eventName,
    event_date: badgeData.eventDate.toISOString(),
    attendee_address: badgeData.attendeeAddress,
    organizer: badgeData.organizer,
    verification_method: badgeData.verificationMethod,
    minted_at: new Date().toISOString(),
    rarity: badgeData.rarity,
    streak_count: badgeData.streakCount,
    category: badgeData.category,
    location: badgeData.location,
  };
}

/**
 * Create attendance proof metadata
 */
export function createAttendanceProofMetadata(
  proofData: {
    attendee: string;
    eventId: string;
    eventName: string;
    timestamp: Date;
    verificationMethod: string;
    proofData: string;
    organizer: string;
    location: string;
  }
): AttendanceProofMetadata {
  return {
    attendee: proofData.attendee,
    event_id: proofData.eventId,
    event_name: proofData.eventName,
    timestamp: proofData.timestamp.toISOString(),
    verification_method: proofData.verificationMethod,
    proof_data: proofData.proofData,
    organizer: proofData.organizer,
    location: proofData.location,
  };
}

/**
 * Upload event metadata to IPFS
 */
export async function uploadEventMetadata(eventData: EventMetadata): Promise<IPFSUploadResult> {
  try {
    const filename = `event-${eventData.event_id}-metadata.json`;
    return await uploadJSONToIPFS(eventData, filename);
  } catch (error) {
    console.error('Failed to upload event metadata:', error);
    throw new Error(`Failed to upload event metadata: ${error}`);
  }
}

/**
 * Upload badge metadata to IPFS
 */
export async function uploadBadgeMetadata(badgeData: BadgeMetadata): Promise<IPFSUploadResult> {
  try {
    const filename = `badge-${badgeData.event_id}-${badgeData.attendee_address}-metadata.json`;
    return await uploadJSONToIPFS(badgeData, filename);
  } catch (error) {
    console.error('Failed to upload badge metadata:', error);
    throw new Error(`Failed to upload badge metadata: ${error}`);
  }
}

/**
 * Upload attendance proof to IPFS
 */
export async function uploadAttendanceProof(proofData: AttendanceProofMetadata): Promise<IPFSUploadResult> {
  try {
    const filename = `proof-${proofData.event_id}-${proofData.attendee}-${Date.now()}.json`;
    return await uploadJSONToIPFS(proofData, filename);
  } catch (error) {
    console.error('Failed to upload attendance proof:', error);
    throw new Error(`Failed to upload attendance proof: ${error}`);
  }
}

/**
 * Generate default event image URL based on category
 */
export function generateDefaultEventImage(category: string): string {
  const imageMap: Record<string, string> = {
    technology: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500',
    education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500',
    art: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500',
    gaming: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500',
    finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500',
    health: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500',
    sports: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
    music: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
    networking: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500',
    default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500',
  };

  return imageMap[category.toLowerCase()] || imageMap.default;
}

/**
 * Generate default badge image URL based on category and rarity
 */
export function generateDefaultBadgeImage(
  category: string,
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common'
): string {
  // In a production app, these would be custom-designed badge images
  const baseImages: Record<string, string> = {
    technology: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300',
    education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300',
    art: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300',
    gaming: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300',
    finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300',
    default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300',
  };

  // Rarity could affect the image border, glow, or overlay
  // For now, we'll use the same base image
  return baseImages[category.toLowerCase()] || baseImages.default;
}

/**
 * Calculate badge rarity based on event and user data
 */
export function calculateBadgeRarity(
  eventData: {
    attendeeCount: number;
    maxAttendees?: number;
    category: string;
    isFirstEvent?: boolean;
  },
  userData: {
    streakCount: number;
    totalBadges: number;
    categoryBadges: number;
  }
): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
  let rarityScore = 0;

  // Factor 1: Event exclusivity
  if (eventData.maxAttendees && eventData.attendeeCount <= eventData.maxAttendees * 0.1) {
    rarityScore += 4; // Very exclusive (top 10%)
  } else if (eventData.maxAttendees && eventData.attendeeCount <= eventData.maxAttendees * 0.25) {
    rarityScore += 3; // Exclusive (top 25%)
  } else if (eventData.maxAttendees && eventData.attendeeCount <= eventData.maxAttendees * 0.5) {
    rarityScore += 2; // Semi-exclusive (top 50%)
  } else {
    rarityScore += 1; // Common attendance
  }

  // Factor 2: User streak
  if (userData.streakCount >= 50) {
    rarityScore += 4;
  } else if (userData.streakCount >= 25) {
    rarityScore += 3;
  } else if (userData.streakCount >= 10) {
    rarityScore += 2;
  } else if (userData.streakCount >= 5) {
    rarityScore += 1;
  }

  // Factor 3: First-time attendance bonus
  if (eventData.isFirstEvent) {
    rarityScore += 2;
  }

  // Factor 4: Category specialization
  if (userData.categoryBadges >= 20) {
    rarityScore += 3; // Category expert
  } else if (userData.categoryBadges >= 10) {
    rarityScore += 2; // Category enthusiast
  } else if (userData.categoryBadges >= 5) {
    rarityScore += 1; // Category regular
  }

  // Convert score to rarity
  if (rarityScore >= 12) return 'legendary';
  if (rarityScore >= 9) return 'epic';
  if (rarityScore >= 6) return 'rare';
  if (rarityScore >= 3) return 'uncommon';
  return 'common';
}

/**
 * Validate NFT metadata format
 */
export function validateNFTMetadata(metadata: any): boolean {
  try {
    // Check required fields
    if (!metadata.name || typeof metadata.name !== 'string') return false;
    if (!metadata.description || typeof metadata.description !== 'string') return false;
    if (!metadata.image || typeof metadata.image !== 'string') return false;

    // Check attributes format if present
    if (metadata.attributes) {
      if (!Array.isArray(metadata.attributes)) return false;
      for (const attr of metadata.attributes) {
        if (!attr.trait_type || typeof attr.trait_type !== 'string') return false;
        if (attr.value === undefined || attr.value === null) return false;
      }
    }

    return true;
  } catch (error) {
    console.error('NFT metadata validation error:', error);
    return false;
  }
}

/**
 * Extract CID from IPFS URL
 */
export function extractCIDFromUrl(url: string): string | null {
  const patterns = [
    /\/ipfs\/([a-zA-Z0-9]+)/,
    /ipfs:\/\/([a-zA-Z0-9]+)/,
    /^(Qm[a-zA-Z0-9]{44})$/,
    /^(ba[a-zA-Z0-9]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Format metadata for display in UI
 */
export function formatMetadataForDisplay(metadata: NFTMetadata): {
  displayName: string;
  displayDescription: string;
  displayAttributes: Array<{ label: string; value: string; type?: string }>;
} {
  const displayAttributes = metadata.attributes?.map(attr => ({
    label: attr.trait_type,
    value: attr.value.toString(),
    type: attr.display_type,
  })) || [];

  return {
    displayName: metadata.name,
    displayDescription: metadata.description,
    displayAttributes,
  };
}

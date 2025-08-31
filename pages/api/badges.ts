import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';
import { base, baseGoerli } from 'viem/chains';

// Initialize public client for reading from blockchain
const publicClient = createPublicClient({
  chain: process.env.NODE_ENV === 'production' ? base : baseGoerli,
  transport: http(),
});

// Badge NFT ABI (minimal for reading badges)
const BADGE_NFT_ABI = [
  'function getBadge(uint256 tokenId) external view returns (tuple(uint256 tokenId, uint256 eventId, address owner, string metadataURI, uint256 issuedTimestamp, bool revoked, string reasonForRevocation) badgeData)',
  'function getUserBadges(address user) external view returns (uint256[] tokenIds)',
  'function getUserActiveBadges(address user) external view returns (uint256[] tokenIds)',
  'function getUserStats(address user) external view returns (uint256 totalBadges, uint256 activeBadges)',
  'function hasAttended(uint256 eventId, address user) external view returns (bool)',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenId, user, eventId, includeRevoked } = req.query;

    // Get contract address from environment or use a default
    const contractAddress = process.env.BADGE_NFT_ADDRESS as `0x${string}`;
    
    if (!contractAddress) {
      return res.status(500).json({ error: 'Badge NFT contract address not configured' });
    }

    // If specific token ID is requested
    if (tokenId) {
      const badgeData = await publicClient.readContract({
        address: contractAddress,
        abi: BADGE_NFT_ABI,
        functionName: 'getBadge',
        args: [BigInt(tokenId as string)],
      });

      return res.status(200).json({ badge: badgeData });
    }

    // If user address is provided, get their badges
    if (user) {
      const userAddress = user as string;
      
      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
        return res.status(400).json({ error: 'Invalid user address format' });
      }

      // Get user's badge token IDs
      const tokenIds = await publicClient.readContract({
        address: contractAddress,
        abi: BADGE_NFT_ABI,
        functionName: 'getUserBadges',
        args: [userAddress as `0x${string}`],
      });

      // Get user stats
      const userStats = await publicClient.readContract({
        address: contractAddress,
        abi: BADGE_NFT_ABI,
        functionName: 'getUserStats',
        args: [userAddress as `0x${string}`],
      });

      const badges = [];
      
      // Fetch badge details for each token ID
      for (const tokenId of tokenIds as bigint[]) {
        try {
          const badgeData = await publicClient.readContract({
            address: contractAddress,
            abi: BADGE_NFT_ABI,
            functionName: 'getBadge',
            args: [tokenId],
          });

          // Filter out revoked badges unless explicitly requested
          const badge = badgeData as any;
          if (includeRevoked === 'true' || !badge.revoked) {
            badges.push(badge);
          }
        } catch (error) {
          console.error(`Error fetching badge ${tokenId}:`, error);
          // Continue with other badges even if one fails
        }
      }

      // Sort badges by issuance timestamp (newest first)
      badges.sort((a, b) => Number(b.issuedTimestamp) - Number(a.issuedTimestamp));

      const stats = userStats as any;
      return res.status(200).json({
        badges,
        stats: {
          totalBadges: Number(stats.totalBadges),
          activeBadges: Number(stats.activeBadges),
        },
        user: userAddress,
      });
    }

    // If event ID is provided, check if user has attended
    if (eventId && user) {
      const userAddress = user as string;
      
      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
        return res.status(400).json({ error: 'Invalid user address format' });
      }

      const hasAttended = await publicClient.readContract({
        address: contractAddress,
        abi: BADGE_NFT_ABI,
        functionName: 'hasAttended',
        args: [BigInt(eventId as string), userAddress as `0x${string}`],
      });

      return res.status(200).json({
        hasAttended,
        eventId: Number(eventId),
        user: userAddress,
      });
    }

    // If no specific parameters, return error
    return res.status(400).json({ 
      error: 'Missing required parameters. Please provide either tokenId, user, or both eventId and user.' 
    });

  } catch (error) {
    console.error('Error in badges API:', error);
    return res.status(500).json({ error: 'Failed to fetch badge data' });
  }
}

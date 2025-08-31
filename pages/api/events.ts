import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';
import { base, baseGoerli } from 'viem/chains';

// Initialize public client for reading from blockchain
const publicClient = createPublicClient({
  chain: process.env.NODE_ENV === 'production' ? base : baseGoerli,
  transport: http(),
});

// Event Manager ABI (minimal for reading events)
const EVENT_MANAGER_ABI = [
  'function getTotalEvents() external view returns (uint256)',
  'function getEvent(uint256 eventId) external view returns (tuple(uint256 eventId, string title, string description, string metadataURI, uint256 timestamp, uint256 endTimestamp, uint256 maxAttendees, uint256 currentAttendees, string location, string category, address organizer, bool active, uint256 createdTimestamp, string reasonForDeactivation) eventData)',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, organizer, category, status } = req.query;

    // Get contract address from environment or use a default
    const contractAddress = process.env.EVENT_MANAGER_ADDRESS as `0x${string}`;
    
    if (!contractAddress) {
      return res.status(500).json({ error: 'Event manager contract address not configured' });
    }

    // If specific event ID is requested
    if (eventId) {
      const eventData = await publicClient.readContract({
        address: contractAddress,
        abi: EVENT_MANAGER_ABI,
        functionName: 'getEvent',
        args: [BigInt(eventId as string)],
      });

      return res.status(200).json({ event: eventData });
    }

    // Get total number of events
    const totalEvents = await publicClient.readContract({
      address: contractAddress,
      abi: EVENT_MANAGER_ABI,
      functionName: 'getTotalEvents',
    });

    const events = [];
    const totalEventsNumber = Number(totalEvents);

    // Fetch all events
    for (let i = 0; i < totalEventsNumber; i++) {
      try {
        const eventData = await publicClient.readContract({
          address: contractAddress,
          abi: EVENT_MANAGER_ABI,
          functionName: 'getEvent',
          args: [BigInt(i)],
        });

        // Apply filters
        const event = eventData as any;
        let includeEvent = true;

        if (organizer && event.organizer.toLowerCase() !== (organizer as string).toLowerCase()) {
          includeEvent = false;
        }

        if (category && event.category !== category) {
          includeEvent = false;
        }

        if (status) {
          if (status === 'active' && !event.active) {
            includeEvent = false;
          } else if (status === 'inactive' && event.active) {
            includeEvent = false;
          }
        }

        if (includeEvent) {
          events.push(event);
        }
      } catch (error) {
        console.error(`Error fetching event ${i}:`, error);
        // Continue with other events even if one fails
      }
    }

    // Sort events by creation timestamp (newest first)
    events.sort((a, b) => Number(b.createdTimestamp) - Number(a.createdTimestamp));

    return res.status(200).json({
      events,
      total: events.length,
      totalEvents: totalEventsNumber,
    });

  } catch (error) {
    console.error('Error in events API:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}

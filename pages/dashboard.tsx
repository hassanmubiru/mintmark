import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/hooks/useWallet';
import { useBadgeNFT, useEventManager } from '@/hooks/useContract';
import { BadgeGallery, BadgeData } from '@/components/BadgeGallery';
import { EventGrid, EventData } from '@/components/EventCard';
import { RoleBadges } from '@/components/RoleGate';
import { useTransactionToast } from '@/hooks/useToast';
import { formatAddress } from '@/utils/formatters';
import { 
  TrophyIcon, 
  CalendarIcon, 
  StarIcon,
  FlameIcon,
  BarChart3Icon,
  EyeIcon
} from 'lucide-react';

export default function DashboardPage() {
  const { address, isConnected } = useWallet();
  const badgeNFT = useBadgeNFT();
  const eventManager = useEventManager();
  const toast = useTransactionToast();

  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<EventData[]>([]);
  const [userStats, setUserStats] = useState({
    totalBadges: 0,
    activeBadges: 0,
    streak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'badges' | 'events' | 'stats'>('badges');

  // Load user data when wallet connects
  useEffect(() => {
    if (isConnected && address && badgeNFT.contract) {
      loadUserData();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address, badgeNFT.contract]);

  const loadUserData = async () => {
    if (!address || !badgeNFT.contract || !eventManager.contract) return;

    setIsLoading(true);
    try {
      // Load user stats
      const statsHook = badgeNFT.getUserStats(address);
      if (statsHook.data) {
        setUserStats({
          totalBadges: Number(statsHook.data[0]),
          activeBadges: Number(statsHook.data[1]),
          streak: 0, // This would need to be calculated or fetched separately
        });
      }

      // Load user badges
      const userBadgeIdsHook = badgeNFT.getUserBadges(address);
      if (!userBadgeIdsHook.data) return;
      
      const badgePromises = userBadgeIdsHook.data.map(async (tokenId: any) => {
        try {
          const badgeHook = badgeNFT.getBadge(tokenId.toNumber());
          const tokenURIHook = badgeNFT.getTokenURI(tokenId.toNumber());
          
          if (!badgeHook.data || !tokenURIHook.data) return null;
          
          const badge = badgeHook.data;
          const tokenURI = tokenURIHook.data;
          
          // Load event details for this badge
          let eventData;
          try {
            const eventHook = eventManager.getEvent(badge.eventId.toNumber());
            eventData = eventHook.data;
          } catch (error) {
            console.error(`Error loading event ${badge.eventId}:`, error);
          }

          return {
            tokenId: tokenId.toString(),
            eventId: badge.eventId.toString(),
            eventName: eventData?.title,
            attendee: badge.attendee,
            mintedAt: badge.mintedAt.toNumber(),
            metadataURI: badge.metadataURI,
            isRevoked: badge.isRevoked,
            revokeReason: badge.revokeReason,
            category: eventData?.category,
            location: eventData?.location,
            eventDate: eventData?.timestamp.toNumber(),
            organizerAddress: eventData?.organizer,
            // These would come from metadata in a real implementation
            rarity: 'common' as const,
            streakCount: Math.floor(Math.random() * 10) + 1, // Mock data
          };
        } catch (error) {
          console.error(`Error loading badge ${tokenId}:`, error);
          return null;
        }
      });

      const loadedBadges = (await Promise.all(badgePromises)).filter(Boolean) as BadgeData[];
      setBadges(loadedBadges);

      // Load attended events
      const eventPromises = loadedBadges.map(async (badge) => {
        try {
          const eventHook = eventManager.getEvent(parseInt(badge.eventId));
          const event = eventHook.data;
          if (!event) return null;
          return {
            id: badge.eventId,
            title: event.title,
            description: event.description,
            metadataURI: event.metadataURI,
            timestamp: event.timestamp.toNumber(),
            endTimestamp: event.endTimestamp.toNumber(),
            organizer: event.organizer,
            isActive: event.isActive,
            maxAttendees: event.maxAttendees.toNumber(),
            currentAttendees: event.currentAttendees.toNumber(),
            location: event.location,
            category: event.category,
            createdAt: event.createdAt.toNumber(),
          };
        } catch (error) {
          console.error(`Error loading event ${badge.eventId}:`, error);
          return null;
        }
      });

      const loadedEvents = (await Promise.all(eventPromises)).filter(Boolean) as EventData[];
      setAttendedEvents(loadedEvents);

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load dashboard data', 'Please try refreshing the page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBadge = (badge: BadgeData) => {
    // Open badge details modal or navigate to badge page
    window.open(`https://opensea.io/assets/base/${badgeNFT.contract?.address}/${badge.tokenId}`, '_blank');
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <>
        <Head>
          <title>Dashboard - MintMark</title>
          <meta name="description" content="View your NFT badge collection and attendance history" />
        </Head>

        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 mb-6">
              Connect your wallet to view your NFT badge collection and attendance history.
            </p>
            <ConnectButton />
            <div className="mt-6">
              <Link href="/" className="text-primary-600 hover:text-primary-700">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - MintMark</title>
        <meta name="description" content="View your NFT badge collection and attendance history" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="container-base">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <TrophyIcon className="w-8 h-8 text-primary-600" />
                  <span className="text-xl font-bold text-gray-900">MintMark</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">Dashboard</span>
              </div>
              
              <div className="flex items-center gap-4">
                <RoleBadges />
                <ConnectButton />
              </div>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-base py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back!
                </h1>
                <p className="text-gray-600">
                  Connected as {address ? formatAddress(address) : 'Unknown'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Link href="/events" className="btn btn-outline">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Browse Events
                </Link>
                <button
                  onClick={loadUserData}
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="container-base py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Badges */}
            <div className="card text-center">
              <div className="card-body">
                <TrophyIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.totalBadges}</div>
                <div className="text-sm text-gray-600">Total Badges</div>
              </div>
            </div>

            {/* Active Badges */}
            <div className="card text-center">
              <div className="card-body">
                <StarIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.activeBadges}</div>
                <div className="text-sm text-gray-600">Active Badges</div>
              </div>
            </div>

            {/* Attendance Streak */}
            <div className="card text-center">
              <div className="card-body">
                <FlameIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.streak}</div>
                <div className="text-sm text-gray-600">Attendance Streak</div>
              </div>
            </div>

            {/* Events Attended */}
            <div className="card text-center">
              <div className="card-body">
                <BarChart3Icon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{attendedEvents.length}</div>
                <div className="text-sm text-gray-600">Events Attended</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('badges')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'badges'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Badge Collection ({badges.length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attended Events ({attendedEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Statistics
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'badges' && (
            <BadgeGallery
              badges={badges}
              isLoading={isLoading}
              showDetails={true}
              showStats={true}
              onView={handleViewBadge}
              emptyMessage="No badges collected yet. Attend events to start collecting!"
            />
          )}

          {activeTab === 'events' && (
            <EventGrid
              events={attendedEvents}
              isLoading={isLoading}
              emptyMessage="No events attended yet. Browse events to get started!"
            />
          )}

          {activeTab === 'stats' && (
            <div className="space-y-8">
              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold">Badge Rarity Distribution</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      {['legendary', 'epic', 'rare', 'uncommon', 'common'].map((rarity) => {
                        const count = badges.filter(b => b.rarity === rarity && !b.isRevoked).length;
                        const percentage = badges.length > 0 ? (count / badges.length) * 100 : 0;
                        
                        return (
                          <div key={rarity} className="flex items-center justify-between">
                            <span className="capitalize text-sm font-medium">{rarity}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    rarity === 'legendary' ? 'bg-orange-500' :
                                    rarity === 'epic' ? 'bg-purple-500' :
                                    rarity === 'rare' ? 'bg-blue-500' :
                                    rarity === 'uncommon' ? 'bg-green-500' :
                                    'bg-gray-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-8">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold">Event Categories</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      {Object.entries(
                        badges.reduce((acc, badge) => {
                          const category = badge.category || 'Other';
                          acc[category] = (acc[category] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm text-gray-600">{count} badge{count !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                </div>
                <div className="card-body">
                  {badges.length === 0 ? (
                    <p className="text-gray-500">No activity yet. Attend your first event to get started!</p>
                  ) : (
                    <div className="space-y-4">
                      {badges
                        .sort((a, b) => b.mintedAt - a.mintedAt)
                        .slice(0, 5)
                        .map((badge) => (
                          <div key={badge.tokenId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <TrophyIcon className="w-6 h-6 text-yellow-500" />
                            <div className="flex-1">
                              <p className="font-medium">
                                Earned badge for {badge.eventName || `Event #${badge.eventId}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(badge.mintedAt * 1000).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleViewBadge(badge)}
                              className="btn btn-sm btn-outline"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

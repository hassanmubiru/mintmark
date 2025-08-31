import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/hooks/useWallet';
import { useRole } from '@/hooks/useRole';
import { EventGrid, EventData } from '@/components/EventCard';
import { useEventManager } from '@/hooks/useContract';
import { APP_CONFIG } from '@/utils/constants';
import { 
  TrophyIcon, 
  CalendarIcon, 
  UsersIcon, 
  StarIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from 'lucide-react';

export default function HomePage() {
  const { isConnected } = useWallet();
  const roleState = useRole();
  const eventManager = useEventManager();
  
  const [featuredEvents, setFeaturedEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalBadges: 0,
    activeUsers: 0,
  });

  // Load featured events and stats
  useEffect(() => {
    async function loadData() {
      try {
        // Load total events count
        if (eventManager.contract) {
          const totalEvents = eventManager.getTotalEvents;
          setStats(prev => ({ ...prev, totalEvents: Number(totalEvents) }));
          
          // Load recent events (last 6)
          const events: EventData[] = [];
          const maxEvents = Math.min(6, Number(totalEvents));
          
          for (let i = Math.max(1, Number(totalEvents) - 5); i <= Number(totalEvents); i++) {
            try {
              const eventHook = eventManager.getEvent(i);
              const event = eventHook.data;
              if (!event) continue;
              events.push({
                id: event.id.toString(),
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
              });
            } catch (error) {
              console.error(`Error loading event ${i}:`, error);
            }
          }
          
          setFeaturedEvents(events.reverse()); // Show newest first
        }
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [eventManager]);

  return (
    <>
      <Head>
        <title>{APP_CONFIG.NAME} - Proof-of-Attendance NFT Platform</title>
        <meta name="description" content={APP_CONFIG.DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-base">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">{APP_CONFIG.NAME}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {isConnected && (
                <div className="hidden md:flex items-center gap-4">
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Link>
                  {roleState.canManageEvents && (
                    <Link href="/organizer" className="text-gray-600 hover:text-gray-900">
                      Organizer
                    </Link>
                  )}
                  {roleState.isAdmin && (
                    <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                      Admin
                    </Link>
                  )}
                </div>
              )}
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-primary text-white py-20">
        <div className="container-base text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Prove Your Presence,<br />
              <span className="text-yellow-300">Collect NFT Badges</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              MintMark is the ultimate proof-of-attendance platform that rewards your participation 
              with unique NFT badges on the Base network.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50"
                    >
                      Connect Wallet to Start
                      <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <>
                  <Link href="/dashboard" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-50">
                    View My Badges
                    <TrophyIcon className="w-5 h-5 ml-2" />
                  </Link>
                  {roleState.canManageEvents && (
                    <Link href="/organizer" className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600">
                      Create Event
                      <CalendarIcon className="w-5 h-5 ml-2" />
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-base">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose MintMark?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The most comprehensive proof-of-attendance platform built for the Web3 era
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrophyIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Unique NFT Badges</h3>
              <p className="text-gray-600">
                Every attendance verification mints a unique ERC-721 NFT badge with 
                event-specific metadata and rarity levels.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Multiple Verification</h3>
              <p className="text-gray-600">
                Support for QR codes, digital signatures, and manual verification 
                to accommodate any event type.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <StarIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Streak & Rarity System</h3>
              <p className="text-gray-600">
                Build attendance streaks and earn rare badges based on your 
                participation patterns and event exclusivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-base">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {stats.totalEvents.toLocaleString()}
              </div>
              <div className="text-gray-600">Events Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {stats.totalBadges.toLocaleString()}
              </div>
              <div className="text-gray-600">Badges Minted</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {stats.activeUsers.toLocaleString()}
              </div>
              <div className="text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-20">
          <div className="container-base">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Featured Events
                </h2>
                <p className="text-gray-600">
                  Discover upcoming events and start collecting badges
                </p>
              </div>
              <Link href="/events" className="btn btn-outline">
                View All Events
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <EventGrid
              events={featuredEvents}
              isLoading={isLoading}
              emptyMessage="No events available"
            />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 gradient-secondary text-white">
        <div className="container-base text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Collecting?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the Web3 community and turn your event attendance into valuable digital collectibles.
          </p>
          
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="btn btn-lg bg-white text-secondary-600 hover:bg-gray-50"
                >
                  Connect Wallet to Get Started
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              )}
            </ConnectButton.Custom>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="btn btn-lg bg-white text-secondary-600 hover:bg-gray-50">
                View Dashboard
              </Link>
              {roleState.canManageEvents && (
                <Link href="/organizer" className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-secondary-600">
                  Create Event
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-base">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrophyIcon className="w-6 h-6 text-primary-400" />
                <span className="text-xl font-bold">{APP_CONFIG.NAME}</span>
              </div>
              <p className="text-gray-400 mb-4">
                The premier proof-of-attendance platform for Web3 events. 
                Collect unique NFT badges and build your on-chain reputation.
              </p>
              <div className="flex gap-4">
                <a href={APP_CONFIG.GITHUB_URL} className="text-gray-400 hover:text-white">
                  GitHub
                </a>
                <a href={APP_CONFIG.DISCORD_URL} className="text-gray-400 hover:text-white">
                  Discord
                </a>
                <a href={APP_CONFIG.TWITTER_URL} className="text-gray-400 hover:text-white">
                  Twitter
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/events" className="hover:text-white">Events</Link></li>
                <li><Link href="/organizer" className="hover:text-white">For Organizers</Link></li>
                <li><Link href="/admin" className="hover:text-white">Admin</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href={APP_CONFIG.DOCUMENTATION_URL} className="hover:text-white">Documentation</a></li>
                <li><a href="/api-docs" className="hover:text-white">API</a></li>
                <li><a href="/support" className="hover:text-white">Support</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {APP_CONFIG.NAME}. Built on Base network.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

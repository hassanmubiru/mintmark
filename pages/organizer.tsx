import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { RoleGate, withRoleGate } from '@/components/RoleGate';
import { EventGrid, EventData } from '@/components/EventCard';
import { useWallet } from '@/hooks/useWallet';
import { useEventManager } from '@/hooks/useContract';
import { useTransactionToast } from '@/hooks/useToast';
import { formatAddress } from '@/utils/formatters';
import { 
  TrophyIcon, 
  PlusIcon,
  CalendarIcon,
  UsersIcon,
  BarChart3Icon,
  SettingsIcon
} from 'lucide-react';

function OrganizerDashboard() {
  const { address } = useWallet();
  const eventManager = useEventManager();
  const toast = useTransactionToast();

  const [myEvents, setMyEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalAttendees: 0,
    averageAttendance: 0,
  });

  // Load organizer's events
  useEffect(() => {
    if (address && eventManager.contract) {
      loadOrganizerData();
    }
  }, [address, eventManager.contract]);

  const loadOrganizerData = async () => {
    if (!address || !eventManager.contract) return;

    setIsLoading(true);
    try {
      // Get events organized by this user
      const eventIdsHook = eventManager.getOrganizerEvents(address);
      if (!eventIdsHook.data) return;
      
      const eventPromises = eventIdsHook.data.map(async (eventId: any) => {
        try {
          const eventHook = eventManager.getEvent(eventId.toNumber());
          const event = eventHook.data;
          if (!event) return null;
          return {
            id: eventId.toString(),
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
          console.error(`Error loading event ${eventId}:`, error);
          return null;
        }
      });

      const loadedEvents = (await Promise.all(eventPromises)).filter(Boolean) as EventData[];
      setMyEvents(loadedEvents);

      // Calculate stats
      const now = Date.now() / 1000;
      const activeEvents = loadedEvents.filter(e => 
        e.isActive && e.timestamp <= now && e.endTimestamp >= now
      ).length;
      
      const totalAttendees = loadedEvents.reduce((sum, event) => sum + event.currentAttendees, 0);
      const averageAttendance = loadedEvents.length > 0 
        ? Math.round(totalAttendees / loadedEvents.length) 
        : 0;

      setStats({
        totalEvents: loadedEvents.length,
        activeEvents,
        totalAttendees,
        averageAttendance,
      });

    } catch (error) {
      console.error('Error loading organizer data:', error);
      toast.error('Failed to load organizer data', 'Please try refreshing the page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEvent = (event: EventData) => {
    // Navigate to edit event page or open modal
    // For now, show a toast
    toast.info('Edit Event', `Edit functionality for ${event.title} would be implemented here`);
  };

  const handleDeleteEvent = async (event: EventData) => {
    if (!confirm(`Are you sure you want to deactivate "${event.title}"?`)) {
      return;
    }

    try {
      const tx = await eventManager.deactivateEvent(
        parseInt(event.id),
        'Deactivated by organizer'
      );
      
      toast.transactionPending(tx.hash);
      await tx.wait();
      toast.transactionSuccess(tx.hash, 'Event deactivated');
      
      // Reload data
      loadOrganizerData();
    } catch (error) {
      console.error('Error deactivating event:', error);
      toast.transactionError(error, 'Event deactivation');
    }
  };

  const handleViewAttendees = (event: EventData) => {
    // Navigate to attendees page or open modal
    toast.info('View Attendees', `Attendee list for ${event.title} would be shown here`);
  };

  return (
    <>
      <Head>
        <title>Organizer Dashboard - MintMark</title>
        <meta name="description" content="Manage your events and track attendance" />
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
                <span className="text-gray-600">Organizer</span>
              </div>
              
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <ConnectButton />
              </div>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-base py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Organizer Dashboard
                </h1>
                <p className="text-gray-600">
                  Manage your events and track attendance as {address ? formatAddress(address) : 'Unknown'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={loadOrganizerData}
                  disabled={isLoading}
                  className="btn btn-outline"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
                <button className="btn btn-primary">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="container-base py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Events */}
            <div className="card text-center">
              <div className="card-body">
                <CalendarIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
            </div>

            {/* Active Events */}
            <div className="card text-center">
              <div className="card-body">
                <div className="flex items-center justify-center mb-2">
                  <div className="status-active"></div>
                  <CalendarIcon className="w-8 h-8 text-green-500 ml-2" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeEvents}</div>
                <div className="text-sm text-gray-600">Active Events</div>
              </div>
            </div>

            {/* Total Attendees */}
            <div className="card text-center">
              <div className="card-body">
                <UsersIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalAttendees}</div>
                <div className="text-sm text-gray-600">Total Attendees</div>
              </div>
            </div>

            {/* Average Attendance */}
            <div className="card text-center">
              <div className="card-body">
                <BarChart3Icon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.averageAttendance}</div>
                <div className="text-sm text-gray-600">Avg. Attendance</div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="card-body text-center">
                <PlusIcon className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Create New Event</h3>
                <p className="text-gray-600 mb-4">Set up a new event and start collecting attendees</p>
                <button className="btn btn-primary">Get Started</button>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="card-body text-center">
                <UsersIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Manage Attendees</h3>
                <p className="text-gray-600 mb-4">View and verify attendee information</p>
                <button className="btn btn-outline">View All</button>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="card-body text-center">
                <SettingsIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Event Settings</h3>
                <p className="text-gray-600 mb-4">Configure verification methods and policies</p>
                <button className="btn btn-outline">Configure</button>
              </div>
            </div>
          </div>

          {/* My Events */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
              <div className="flex gap-2">
                <select className="form-input w-auto">
                  <option value="all">All Events</option>
                  <option value="active">Active Only</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
                <button className="btn btn-outline">
                  <SettingsIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <EventGrid
              events={myEvents}
              isLoading={isLoading}
              showActions={true}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onViewAttendees={handleViewAttendees}
              emptyMessage="No events created yet. Create your first event to get started!"
            />
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="btn btn-outline justify-start">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Event
                </button>
                <button className="btn btn-outline justify-start">
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Bulk Verify
                </button>
                <button className="btn btn-outline justify-start">
                  <BarChart3Icon className="w-4 h-4 mr-2" />
                  View Analytics
                </button>
                <button className="btn btn-outline justify-start">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Wrap with role gate to require organizer permissions
export default withRoleGate(OrganizerDashboard, ['organizer', 'admin'], {
  redirectTo: '/',
  showFallback: true,
});

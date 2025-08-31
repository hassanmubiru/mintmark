import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useEventManager, useBadgeNFT, useAttendance } from '@/hooks/useContract';
import { APP_CONFIG } from '@/utils/constants';

interface Event {
  eventId: number;
  title: string;
  description: string;
  metadataURI: string;
  timestamp: number;
  endTimestamp: number;
  maxAttendees: number;
  currentAttendees: number;
  location: string;
  category: string;
  organizer: string;
  active: boolean;
  createdTimestamp: number;
  reasonForDeactivation: string;
}

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { address, isConnected } = useAccount();
  const { getEvent } = useEventManager();
  const { hasAttended } = useBadgeNFT();
  const { getAttendanceRecord } = useAttendance();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUserAttended, setHasUserAttended] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id, address]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const eventId = Number(id);
      
      // Fetch event details
      const eventData = getEvent(eventId);
      if (eventData.data) {
        setEvent(eventData.data);
      }

      // Check if user has attended
      if (address) {
        const attended = hasAttended(eventId, address);
        if (attended.data) {
          setHasUserAttended(attended.data);
        }

        // Get attendance record
        const record = getAttendanceRecord(eventId, address);
        if (record.data) {
          setAttendanceRecord(record.data);
        }
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-error">Inactive</span>
    );
  };

  const getAttendanceStatus = () => {
    if (!isConnected) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Connect your wallet to attend
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You need to connect your wallet to attend this event and receive your attendance badge.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (hasUserAttended) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                You have attended this event!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your attendance has been verified and your badge has been minted.</p>
                {attendanceRecord && (
                  <p className="mt-1">Verified on: {formatDate(attendanceRecord.timestamp)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!event?.active) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Event is not active
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>This event is currently inactive and cannot be attended.</p>
                {event?.reasonForDeactivation && (
                  <p className="mt-1">Reason: {event.reasonForDeactivation}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Ready to attend
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>This event is active and ready for attendance verification.</p>
            </div>
            <div className="mt-4">
              <Link
                href={`/events/${id}/attend`}
                className="btn btn-primary"
              >
                Attend Event
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Event - {APP_CONFIG.NAME}</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4 text-gray-600">Loading event details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Head>
          <title>Event Not Found - {APP_CONFIG.NAME}</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Event not found</h3>
            <p className="text-gray-500 mb-4">The event you're looking for doesn't exist or has been removed.</p>
            <Link href="/events" className="btn btn-primary">
              Back to Events
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{event.title} - {APP_CONFIG.NAME}</title>
        <meta name="description" content={event.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center space-x-4">
                <Link href="/events" className="btn btn-ghost btn-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Events
                </Link>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Organized by {event.organizer}
                  </p>
                </div>
                {getStatusBadge(event.active)}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Event Description */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About this event</h2>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>

              {/* Event Details */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date & Time</label>
                      <p className="text-gray-900">{formatDate(event.timestamp)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">End Time</label>
                      <p className="text-gray-900">{formatDate(event.endTimestamp)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Location</label>
                      <p className="text-gray-900">{event.location}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Category</label>
                      <p className="text-gray-900">{event.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Attendees</label>
                      <p className="text-gray-900">{event.currentAttendees} / {event.maxAttendees}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created</label>
                      <p className="text-gray-900">{formatDate(event.createdTimestamp)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Attendance Status */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Status</h2>
                {getAttendanceStatus()}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link href="/dashboard" className="btn btn-outline w-full">
                    View My Badges
                  </Link>
                  <Link href="/events" className="btn btn-outline w-full">
                    Browse All Events
                  </Link>
                  {isConnected && event.active && !hasUserAttended && (
                    <Link href={`/events/${id}/attend`} className="btn btn-primary w-full">
                      Attend Event
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

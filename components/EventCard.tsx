import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate, formatAddress } from '@/utils/formatters';
import { generateDefaultEventImage } from '@/utils/metadata';
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon } from 'lucide-react';

export interface EventData {
  id: string;
  title: string;
  description: string;
  metadataURI?: string;
  timestamp: number;
  endTimestamp: number;
  organizer: string;
  isActive: boolean;
  maxAttendees: number;
  currentAttendees: number;
  location: string;
  category: string;
  createdAt: number;
}

interface EventCardProps {
  event: EventData;
  showActions?: boolean;
  onEdit?: (event: EventData) => void;
  onDelete?: (event: EventData) => void;
  onViewAttendees?: (event: EventData) => void;
  className?: string;
}

export function EventCard({
  event,
  showActions = false,
  onEdit,
  onDelete,
  onViewAttendees,
  className = '',
}: EventCardProps) {
  const eventDate = new Date(event.timestamp * 1000);
  const endDate = new Date(event.endTimestamp * 1000);
  const now = new Date();
  
  // Determine event status
  const getEventStatus = () => {
    if (!event.isActive) return 'cancelled';
    if (now < eventDate) return 'upcoming';
    if (now >= eventDate && now <= endDate) return 'ongoing';
    return 'completed';
  };

  const status = getEventStatus();
  
  // Status styling
  const getStatusStyle = () => {
    switch (status) {
      case 'upcoming':
        return 'badge-primary';
      case 'ongoing':
        return 'badge-success';
      case 'completed':
        return 'badge-secondary';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'ongoing':
        return 'Live Now';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  // Calculate attendance percentage
  const attendancePercentage = event.maxAttendees > 0 
    ? (event.currentAttendees / event.maxAttendees) * 100 
    : 0;

  const imageUrl = generateDefaultEventImage(event.category);

  return (
    <div className={`card-hover ${className}`}>
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={imageUrl}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Fallback to default image if load fails
            e.currentTarget.src = generateDefaultEventImage('default');
          }}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`badge ${getStatusStyle()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className="badge badge-secondary bg-black/50 text-white border-none">
            {event.category}
          </span>
        </div>

        {/* Live indicator for ongoing events */}
        {status === 'ongoing' && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm">
              <div className="status-active"></div>
              <span>Live</span>
            </div>
          </div>
        )}
      </div>

      {/* Event Content */}
      <div className="card-body">
        {/* Title and Description */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {event.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3">
            {event.description}
          </p>
        </div>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>{formatDate(eventDate, 'datetime')}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4" />
            <span className="truncate">{event.location}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>
              {Math.round((event.endTimestamp - event.timestamp) / 3600)} hours
            </span>
          </div>

          {/* Attendance */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UsersIcon className="w-4 h-4" />
            <span>
              {event.currentAttendees} 
              {event.maxAttendees > 0 && ` / ${event.maxAttendees}`} 
              attendees
            </span>
          </div>
        </div>

        {/* Attendance Progress Bar */}
        {event.maxAttendees > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Attendance</span>
              <span>{Math.round(attendancePercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  attendancePercentage >= 90 
                    ? 'bg-red-500' 
                    : attendancePercentage >= 70 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Organizer */}
        <div className="text-xs text-gray-500 mb-4">
          Organized by: {formatAddress(event.organizer)}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {/* View Details Button */}
          <Link 
            href={`/events/${event.id}`}
            className="btn btn-primary flex-1 text-center"
          >
            View Details
          </Link>

          {/* Action Buttons (for organizers/admins) */}
          {showActions && (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(event)}
                  className="btn btn-outline"
                  title="Edit Event"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              
              {onViewAttendees && (
                <button
                  onClick={() => onViewAttendees(event)}
                  className="btn btn-outline"
                  title="View Attendees"
                >
                  <UsersIcon className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(event)}
                  className="btn btn-outline text-red-600 hover:bg-red-50 hover:border-red-200"
                  title="Delete Event"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for EventCard
 */
export function EventCardSkeleton() {
  return (
    <div className="card animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-200"></div>
      
      {/* Content Skeleton */}
      <div className="card-body">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
        
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        <div className="h-2 bg-gray-200 rounded mb-4"></div>
        
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded flex-1"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component for displaying multiple event cards in a grid
 */
interface EventGridProps {
  events: EventData[];
  isLoading?: boolean;
  showActions?: boolean;
  onEdit?: (event: EventData) => void;
  onDelete?: (event: EventData) => void;
  onViewAttendees?: (event: EventData) => void;
  emptyMessage?: string;
  className?: string;
}

export function EventGrid({
  events,
  isLoading = false,
  showActions = false,
  onEdit,
  onDelete,
  onViewAttendees,
  emptyMessage = "No events found",
  className = '',
}: EventGridProps) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <CalendarIcon className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600">
          Check back later for upcoming events or create your first event.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          showActions={showActions}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewAttendees={onViewAttendees}
        />
      ))}
    </div>
  );
}

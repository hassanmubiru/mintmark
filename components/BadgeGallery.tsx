import React, { useState } from 'react';
import Image from 'next/image';
import { formatDate, formatAddress } from '@/utils/formatters';
import { generateDefaultBadgeImage } from '@/utils/metadata';
import { CalendarIcon, MapPinIcon, TrophyIcon, StarIcon } from 'lucide-react';

export interface BadgeData {
  tokenId: string;
  eventId: string;
  eventName?: string;
  attendee: string;
  mintedAt: number;
  metadataURI: string;
  isRevoked: boolean;
  revokeReason?: string;
  // Additional metadata fields
  category?: string;
  location?: string;
  eventDate?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  streakCount?: number;
  organizerAddress?: string;
}

interface BadgeCardProps {
  badge: BadgeData;
  showDetails?: boolean;
  onView?: (badge: BadgeData) => void;
  onRevoke?: (badge: BadgeData) => void;
  className?: string;
}

export function BadgeCard({
  badge,
  showDetails = false,
  onView,
  onRevoke,
  className = '',
}: BadgeCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-orange-500 bg-orange-100';
      case 'epic':
        return 'text-purple-500 bg-purple-100';
      case 'rare':
        return 'text-blue-500 bg-blue-100';
      case 'uncommon':
        return 'text-green-500 bg-green-100';
      case 'common':
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getRarityStars = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return 5;
      case 'epic':
        return 4;
      case 'rare':
        return 3;
      case 'uncommon':
        return 2;
      case 'common':
      default:
        return 1;
    }
  };

  const imageUrl = !imageError 
    ? generateDefaultBadgeImage(badge.category || 'default', badge.rarity)
    : generateDefaultBadgeImage('default');

  return (
    <div className={`nft-card relative ${badge.isRevoked ? 'opacity-60' : ''} ${className}`}>
      {/* Shine effect */}
      <div className="nft-shine"></div>
      
      {/* Revoked Badge */}
      {badge.isRevoked && (
        <div className="absolute top-2 left-2 z-10">
          <span className="badge badge-error">Revoked</span>
        </div>
      )}

      {/* Rarity Badge */}
      {badge.rarity && (
        <div className="absolute top-2 right-2 z-10">
          <span className={`badge ${getRarityColor(badge.rarity)} border-none`}>
            {badge.rarity}
          </span>
        </div>
      )}

      {/* Badge Image */}
      <div className="relative h-64 overflow-hidden rounded-t-lg">
        <Image
          src={imageUrl}
          alt={badge.eventName || `Badge #${badge.tokenId}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          onError={() => setImageError(true)}
        />
        
        {/* Rarity glow effect */}
        {badge.rarity && badge.rarity !== 'common' && (
          <div className={`absolute inset-0 bg-gradient-to-r opacity-20 ${
            badge.rarity === 'legendary' ? 'from-orange-400 to-yellow-400' :
            badge.rarity === 'epic' ? 'from-purple-400 to-pink-400' :
            badge.rarity === 'rare' ? 'from-blue-400 to-cyan-400' :
            'from-green-400 to-emerald-400'
          }`}></div>
        )}
      </div>

      {/* Badge Content */}
      <div className="card-body">
        {/* Badge Name and Token ID */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {badge.eventName || `Event Badge #${badge.tokenId}`}
          </h3>
          <p className="text-sm text-gray-500">Token ID: #{badge.tokenId}</p>
        </div>

        {/* Rarity Stars */}
        {badge.rarity && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon
                key={index}
                className={`w-4 h-4 ${
                  index < getRarityStars(badge.rarity)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-1">
              {badge.rarity}
            </span>
          </div>
        )}

        {/* Badge Details */}
        {showDetails && (
          <div className="space-y-2 mb-4 text-sm">
            {badge.eventDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDate(badge.eventDate * 1000, 'short')}</span>
              </div>
            )}

            {badge.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPinIcon className="w-4 h-4" />
                <span className="truncate">{badge.location}</span>
              </div>
            )}

            {badge.category && (
              <div className="flex items-center gap-2 text-gray-600">
                <TrophyIcon className="w-4 h-4" />
                <span>{badge.category}</span>
              </div>
            )}

            {badge.streakCount && badge.streakCount > 1 && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Streak: {badge.streakCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Mint Date */}
        <div className="text-xs text-gray-500 mb-4">
          Minted: {formatDate(badge.mintedAt * 1000, 'relative')}
        </div>

        {/* Owner (if different from viewer) */}
        {badge.attendee && (
          <div className="text-xs text-gray-500 mb-4">
            Owner: {formatAddress(badge.attendee)}
          </div>
        )}

        {/* Revoke Reason */}
        {badge.isRevoked && badge.revokeReason && (
          <div className="alert alert-error text-xs mb-4">
            <strong>Revoked:</strong> {badge.revokeReason}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onView && (
            <button
              onClick={() => onView(badge)}
              className="btn btn-primary flex-1"
            >
              View Details
            </button>
          )}

          {onRevoke && !badge.isRevoked && (
            <button
              onClick={() => onRevoke(badge)}
              className="btn btn-outline text-red-600 hover:bg-red-50 hover:border-red-200"
              title="Revoke Badge"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for BadgeCard
 */
export function BadgeCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-64 bg-gray-200 rounded-t-lg"></div>
      <div className="card-body">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

/**
 * Component for displaying badge statistics
 */
interface BadgeStatsProps {
  badges: BadgeData[];
  className?: string;
}

export function BadgeStats({ badges, className = '' }: BadgeStatsProps) {
  const activeBadges = badges.filter(badge => !badge.isRevoked);
  const revokedBadges = badges.filter(badge => badge.isRevoked);
  
  const rarityCount = {
    legendary: activeBadges.filter(b => b.rarity === 'legendary').length,
    epic: activeBadges.filter(b => b.rarity === 'epic').length,
    rare: activeBadges.filter(b => b.rarity === 'rare').length,
    uncommon: activeBadges.filter(b => b.rarity === 'uncommon').length,
    common: activeBadges.filter(b => b.rarity === 'common' || !b.rarity).length,
  };

  const categoryCount = activeBadges.reduce((acc, badge) => {
    const category = badge.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxStreak = Math.max(...activeBadges.map(b => b.streakCount || 0), 0);

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* Total Badges */}
      <div className="card text-center">
        <div className="card-body">
          <div className="text-2xl font-bold text-primary-600">{activeBadges.length}</div>
          <div className="text-sm text-gray-600">Total Badges</div>
        </div>
      </div>

      {/* Legendary Badges */}
      <div className="card text-center">
        <div className="card-body">
          <div className="text-2xl font-bold text-orange-500">{rarityCount.legendary}</div>
          <div className="text-sm text-gray-600">Legendary</div>
        </div>
      </div>

      {/* Categories */}
      <div className="card text-center">
        <div className="card-body">
          <div className="text-2xl font-bold text-green-500">{Object.keys(categoryCount).length}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
      </div>

      {/* Max Streak */}
      <div className="card text-center">
        <div className="card-body">
          <div className="text-2xl font-bold text-blue-500">{maxStreak}</div>
          <div className="text-sm text-gray-600">Max Streak</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component for displaying multiple badges in a grid
 */
interface BadgeGalleryProps {
  badges: BadgeData[];
  isLoading?: boolean;
  showDetails?: boolean;
  showStats?: boolean;
  onView?: (badge: BadgeData) => void;
  onRevoke?: (badge: BadgeData) => void;
  emptyMessage?: string;
  className?: string;
}

export function BadgeGallery({
  badges,
  isLoading = false,
  showDetails = false,
  showStats = false,
  onView,
  onRevoke,
  emptyMessage = "No badges found",
  className = '',
}: BadgeGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rarity'>('newest');

  // Filter badges
  const filteredBadges = badges.filter(badge => {
    switch (filter) {
      case 'active':
        return !badge.isRevoked;
      case 'revoked':
        return badge.isRevoked;
      default:
        return true;
    }
  });

  // Sort badges
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.mintedAt - b.mintedAt;
      case 'rarity':
        const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        const aRarity = rarityOrder[a.rarity as keyof typeof rarityOrder] || 1;
        const bRarity = rarityOrder[b.rarity as keyof typeof rarityOrder] || 1;
        return bRarity - aRarity;
      case 'newest':
      default:
        return b.mintedAt - a.mintedAt;
    }
  });

  if (isLoading) {
    return (
      <div className={className}>
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body text-center">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <BadgeCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Stats */}
      {showStats && badges.length > 0 && (
        <BadgeStats badges={badges} className="mb-8" />
      )}

      {/* Filters and Sorting */}
      {badges.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            >
              All ({badges.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`}
            >
              Active ({badges.filter(b => !b.isRevoked).length})
            </button>
            <button
              onClick={() => setFilter('revoked')}
              className={`btn btn-sm ${filter === 'revoked' ? 'btn-primary' : 'btn-outline'}`}
            >
              Revoked ({badges.filter(b => b.isRevoked).length})
            </button>
          </div>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="form-input w-auto"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rarity">By Rarity</option>
          </select>
        </div>
      )}

      {/* Badge Grid */}
      {sortedBadges.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrophyIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyMessage}
          </h3>
          <p className="text-gray-600">
            Attend events to start collecting badges!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedBadges.map((badge) => (
            <BadgeCard
              key={badge.tokenId}
              badge={badge}
              showDetails={showDetails}
              onView={onView}
              onRevoke={onRevoke}
            />
          ))}
        </div>
      )}
    </div>
  );
}

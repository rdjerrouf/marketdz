// src/components/common/FavoriteButton.tsx - Reusable favorite button component
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFavoriteStatus } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

interface FavoriteButtonProps {
  listingId: string;
  listingOwnerId?: string; // Add this to check if user owns the listing
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
}

export default function FavoriteButton({
  listingId,
  listingOwnerId,
  size = 'md',
  showText = false,
  className = '',
  onToggle
}: FavoriteButtonProps) {
  const { isFavorited, loading, toggleFavorite } = useFavoriteStatus(listingId);
  const { user } = useAuth();
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();
  const isAuthenticated = !!user;

  // Check if the current user owns this listing
  const isOwnListing = user && listingOwnerId && user.id === listingOwnerId;

  const handleToggle = async (e: React.MouseEvent) => {
    console.log('🔥🔥🔥 FavoriteButton handleToggle called - BEFORE stopping propagation');

    // CRITICAL: Stop propagation IMMEDIATELY before any other logic
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();

    console.log('🔥 FavoriteButton handleToggle called');
    console.log('- isAuthenticated:', isAuthenticated);
    console.log('- isToggling:', isToggling);
    console.log('- loading:', loading);
    console.log('- isOwnListing:', isOwnListing);
    console.log('- user:', user ? { id: user.id } : 'null');
    console.log('- listingOwnerId:', listingOwnerId);
    console.log('- isFavorited:', isFavorited);

    if (isToggling || loading) {
      console.log('🔥 Blocked: already toggling or loading');
      return;
    }
    
    // Prevent users from favoriting their own listings
    if (isOwnListing) {
      console.log('🔥 User tried to favorite their own listing');
      alert("You can't favorite your own listing!");
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('🔥 User not authenticated, showing prompt');
      if (confirm('Please sign in to add favorites. Would you like to go to the sign in page?')) {
        router.push('/signin');
      }
      return;
    }
    
    setIsToggling(true);
    console.log('🔥 Calling toggleFavorite...');
    try {
      const result = await toggleFavorite();
      console.log('🔥 toggleFavorite result:', result);
      
      if (result.success) {
        console.log('🔥 Success! Action:', result.action);
        onToggle?.(result.action === 'added');
      } else if (result.requiresAuth) {
        // Show a nice message and redirect to sign in
        console.log('🔥 requiresAuth is true, showing confirm dialog');
        if (confirm('Please sign in to add favorites. Would you like to go to the sign in page?')) {
          router.push('/signin');
        }
      } else {
        // Show error message (you can customize this)
        console.error('🔥 Failed to toggle favorite:', result.error);
        alert(`Failed to toggle favorite: ${result.error}`);
      }
    } catch (error) {
      console.error('🔥 Error toggling favorite:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('🔥 Finally block - setting isToggling to false');
      setIsToggling(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg'
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const isActive = isToggling || loading;

  // Don't render the button for own listings
  if (isOwnListing) {
    return null;
  }

  return (
    <button
      data-favorite-button="true"
      onClick={(e) => {
        console.log('❤️ BUTTON onClick fired');
        handleToggle(e);
      }}
      disabled={isActive}
      className={`
        inline-flex items-center justify-center rounded-full
        transition-all duration-200
        ${sizeClasses[size]}
        ${isFavorited
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-red-600'
        }
        ${isActive ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${!isAuthenticated ? 'opacity-60' : ''}
        ${className}
      `}
      title={
        !isAuthenticated
          ? 'Sign in to add to favorites'
          : (isFavorited ? 'Remove from favorites' : 'Add to favorites')
      }
    >
      {isActive ? (
        // Loading spinner
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSize[size]}`} />
      ) : (
        // Heart icon
        <svg
          className={iconSize[size]}
          fill={isFavorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
      
      {showText && (
        <span className="ml-1 text-sm font-medium">
          {isFavorited ? 'Favorited' : 'Add'}
        </span>
      )}
    </button>
  );
}

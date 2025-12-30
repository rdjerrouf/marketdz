/**
 * useFavorites Hook - Favorites Management with Caching
 *
 * OPTIMIZATIONS:
 * - 30-second cache to reduce DB queries (important for mobile networks)
 * - Optimistic updates for instant UI feedback
 * - Abort controllers to cancel stale requests on page changes
 * - Authorization header forwarding for RLS policies
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Favorite {
  favoriteId: string;
  favoritedAt: string;
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    wilaya: string;
    city: string;
    photos: string[];
    created_at: string;
    user_id: string;
    status: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string;
      city: string;
      wilaya: string;
      rating: number;
    } | null;
  };
}

interface FavoritesData {
  favorites: Favorite[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Note: Using global auth context from @/contexts/AuthContext
// Removed local useAuth to prevent conflicts

/**
 * Global cache for favorites data
 * Why cache: Reduces DB load when navigating between pages
 * TTL: 30 seconds (balance between freshness and performance)
 */
const favoritesCache = new Map<string, { data: FavoritesData; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache

export function useFavorites(page: number = 1, limit: number = 20) {
  const [data, setData] = useState<FavoritesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const abortController = useRef<AbortController | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setData({
        favorites: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      });
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = `${user?.id}-${page}-${limit}`;
    const cached = favoritesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cancel previous request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const url = `/api/favorites?page=${page}&limit=${limit}`;

      const response = await fetch(url, {
        headers,
        signal: abortController.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch favorites');
      }

      const favoritesData = await response.json();

      // Cache the result
      favoritesCache.set(cacheKey, {
        data: favoritesData,
        timestamp: Date.now()
      });

      setData(favoritesData);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!authLoading) {
      fetchFavorites();
    }
  }, [page, limit, authLoading, isAuthenticated]);

  const refetch = useCallback(() => {
    // Clear cache for this user when manually refetching
    if (user?.id) {
      const keysToDelete = Array.from(favoritesCache.keys()).filter(key => key.startsWith(`${user.id}-`));
      keysToDelete.forEach(key => favoritesCache.delete(key));
    }
    fetchFavorites();
  }, [fetchFavorites, user?.id]);

  /**
   * Optimistic update for removing favorites
   * Why optimistic: Instant UI feedback while DB request is in flight
   * Improves perceived performance on slow mobile networks
   */
  const removeFavoriteOptimistic = useCallback((favoriteId: string) => {
    if (!data) return;

    // Optimistically remove from local state
    const updatedFavorites = data.favorites.filter(fav => fav.favoriteId !== favoriteId);
    const updatedData = {
      ...data,
      favorites: updatedFavorites,
      pagination: {
        ...data.pagination,
        totalItems: data.pagination.totalItems ? data.pagination.totalItems - 1 : 0
      }
    };

    setData(updatedData);

    // Update cache
    if (user?.id) {
      const cacheKey = `${user.id}-${page}-${limit}`;
      favoritesCache.set(cacheKey, {
        data: updatedData,
        timestamp: Date.now()
      });
    }
  }, [data, user?.id, page, limit]);

  return {
    data,
    loading,
    error,
    refetch,
    removeFavoriteOptimistic
  };
}

export function useFavoriteStatus(listingId: string) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  const checkFavoriteStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsFavorited(false);
      setFavoriteId(null);
      setLoading(false);
      return;
    }

    try {
      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/favorites/${listingId}`, {
        credentials: 'same-origin',
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
        setFavoriteId(data.favoriteId);
      } else if (response.status === 401) {
        // User not authenticated, reset state
        setIsFavorited(false);
        setFavoriteId(null);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setLoading(false);
    }
  }, [listingId, isAuthenticated]);

  useEffect(() => {
    if (!authLoading && listingId) {
      checkFavoriteStatus();
    }
  }, [checkFavoriteStatus, authLoading, listingId]);

  const toggleFavorite = async () => {
    console.log('🔍 toggleFavorite: ========== STARTING ==========');
    console.log('🔍 toggleFavorite: isAuthenticated =', isAuthenticated);
    console.log('🔍 toggleFavorite: user =', user ? { id: user.id, email: user.email } : 'null');
    console.log('🔍 toggleFavorite: listingId =', listingId);
    console.log('🔍 toggleFavorite: isFavorited =', isFavorited);

    if (!isAuthenticated) {
      console.log('🔍 toggleFavorite: User not authenticated, returning requiresAuth');
      return { 
        success: false, 
        error: 'Please sign in to add favorites',
        requiresAuth: true 
      };
    }

    try {
      console.log('🔍 toggleFavorite: Getting session...');
      
      // Get current session to include token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 toggleFavorite: Session:', session ? 'exists' : 'null');
      console.log('🔍 toggleFavorite: Session error:', sessionError);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('🔍 toggleFavorite: Added auth header with token (first 20 chars):', session.access_token.substring(0, 20));
      } else {
        console.warn('🔍 toggleFavorite: No access token available!');
      }
      
      if (isFavorited) {
        console.log('🔍 toggleFavorite: Removing from favorites...');
        // Remove from favorites
        const url = `/api/favorites/${listingId}`;
        console.log('🔍 toggleFavorite: DELETE URL:', url);
        
        const response = await fetch(url, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers
        });

        console.log('🔍 toggleFavorite: Response status:', response.status);
        console.log('🔍 toggleFavorite: Response ok:', response.ok);

        if (response.ok) {
          const responseData = await response.json();
          console.log('🔍 toggleFavorite: Response data:', responseData);
          setIsFavorited(false);
          setFavoriteId(null);
          return { success: true, action: 'removed' };
        } else {
          const errorData = await response.json();
          console.error('🔍 toggleFavorite: Error response:', errorData);
          throw new Error(errorData.error || 'Failed to remove favorite');
        }
      } else {
        console.log('🔍 toggleFavorite: Adding to favorites...');
        // Add to favorites
        const url = '/api/favorites';
        console.log('🔍 toggleFavorite: POST URL:', url);
        console.log('🔍 toggleFavorite: POST body:', JSON.stringify({ listingId }));
        
        const response = await fetch(url, {
          method: 'POST',
          credentials: 'same-origin',
          headers,
          body: JSON.stringify({ listingId })
        });

        console.log('🔍 toggleFavorite: Response status:', response.status);
        console.log('🔍 toggleFavorite: Response ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 toggleFavorite: Response data:', data);
          setIsFavorited(true);
          setFavoriteId(data.favorite.id);
          return { success: true, action: 'added' };
        } else {
          const errorText = await response.text();
          console.error('🔍 toggleFavorite: Error response text:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          console.error('🔍 toggleFavorite: Error data:', errorData);
          throw new Error(errorData.error || 'Failed to add favorite');
        }
      }
    } catch (error) {
      console.error('🔍 toggleFavorite: ========== ERROR ==========');
      console.error('🔍 toggleFavorite: Error:', error);
      console.error('🔍 toggleFavorite: Error message:', error instanceof Error ? error.message : 'Unknown');
      console.error('🔍 toggleFavorite: Error stack:', error instanceof Error ? error.stack : 'N/A');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      };
    }
  };

  return {
    isFavorited,
    favoriteId,
    loading,
    toggleFavorite
  };
}

// Hook for bulk favorite operations
export function useFavoritesActions() {
  const addToFavorites = async (listingId: string) => {
    try {
      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers,
        body: JSON.stringify({ listingId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add favorite');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  };

  const removeFromFavorites = async (listingId: string) => {
    try {
      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/favorites/${listingId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove favorite');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  };

  return {
    addToFavorites,
    removeFromFavorites
  };
}

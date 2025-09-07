// src/hooks/useFavorites.ts - Custom hook for favorites management
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

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

// Hook to check authentication status
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, isAuthenticated: !!user };
}

export function useFavorites(page: number = 1, limit: number = 20) {
  const [data, setData] = useState<FavoritesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const fetchFavorites = async () => {
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

    try {
      setLoading(true);
      setError(null);

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
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch favorites');
      }

      const favoritesData = await response.json();
      setData(favoritesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchFavorites();
    }
  }, [page, limit, authLoading, isAuthenticated]);

  const refetch = () => {
    fetchFavorites();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
}

export function useFavoriteStatus(listingId: string) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const checkFavoriteStatus = async () => {
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
  };

  useEffect(() => {
    if (!authLoading && listingId) {
      checkFavoriteStatus();
    }
  }, [listingId, isAuthenticated, authLoading]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      return { 
        success: false, 
        error: 'Please sign in to add favorites',
        requiresAuth: true 
      };
    }

    try {
      console.log('🔍 toggleFavorite: Starting...');
      
      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 toggleFavorite: Session:', session ? 'exists' : 'null');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('🔍 toggleFavorite: Added auth header');
      }
      
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/${listingId}`, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers
        });

        if (response.ok) {
          setIsFavorited(false);
          setFavoriteId(null);
          return { success: true, action: 'removed' };
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove favorite');
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          credentials: 'same-origin',
          headers,
          body: JSON.stringify({ listingId })
        });

        if (response.ok) {
          const data = await response.json();
          setIsFavorited(true);
          setFavoriteId(data.favorite.id);
          return { success: true, action: 'added' };
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add favorite');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
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

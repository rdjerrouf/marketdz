// src/hooks/useUserListings.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ListingWithStats {
  id: string
  title: string
  description: string | null
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  price: number | null
  status: 'active' | 'sold' | 'rented' | 'completed' | 'expired'
  photos: string[]
  location_city: string | null
  location_wilaya: string | null
  views_count: number
  favorites_count: number
  created_at: string
  updated_at: string
  conversation_count: number
  favorite_count: number
}

export function useUserListings(
  userId: string, 
  status?: 'active' | 'sold' | 'rented' | 'completed' | 'expired' | 'all',
  category?: 'for_sale' | 'job' | 'service' | 'for_rent' | 'all'
) {
  const [listings, setListings] = useState<ListingWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchListings = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          category,
          price,
          status,
          photos,
          location_city,
          location_wilaya,
          views_count,
          favorites_count,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error

      // Ensure data is not null and handle stats
      if (!data) {
        setListings([])
        return
      }

      // Fetch additional stats for each listing
      const listingsWithStats = await Promise.all(
        data.map(async (listing: any) => {
          // Get conversation count
          const { count: conversationCount } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', listing.id)

          // Get favorite count
          const { count: favoriteCount } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', listing.id)

          return {
            ...listing,
            conversation_count: conversationCount || 0,
            favorite_count: favoriteCount || 0
          } as ListingWithStats
        })
      )

      setListings(listingsWithStats)

    } catch (err) {
      console.error('Error fetching user listings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch listings')
    } finally {
      setLoading(false)
    }
  }, [userId, status, category])

  const updateListingStatus = useCallback(async (
    listingId: string, 
    newStatus: 'active' | 'sold' | 'rented' | 'completed' | 'expired'
  ) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId)

      if (error) throw error

      // Update local state
      setListings(prev => prev.map(listing =>
        listing.id === listingId
          ? { ...listing, status: newStatus }
          : listing
      ))

      return { success: true }

    } catch (err) {
      console.error('Error updating listing status:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update status' 
      }
    }
  }, [])

  const deleteListing = useCallback(async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

      if (error) throw error

      // Update local state
      setListings(prev => prev.filter(listing => listing.id !== listingId))

      return { success: true }

    } catch (err) {
      console.error('Error deleting listing:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete listing' 
      }
    }
  }, [])

  const duplicateListing = useCallback(async (listing: ListingWithStats) => {
    try {
      const { error } = await supabase
        .from('listings')
        .insert({
          user_id: userId,
          title: `${listing.title} (Copy)`,
          description: listing.description,
          category: listing.category,
          price: listing.price,
          location_city: listing.location_city,
          location_wilaya: listing.location_wilaya,
          photos: listing.photos,
          status: 'active'
        })

      if (error) throw error

      // Refresh listings
      await fetchListings()

      return { success: true }

    } catch (err) {
      console.error('Error duplicating listing:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to duplicate listing' 
      }
    }
  }, [userId, fetchListings])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Calculate statistics
  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    sold: listings.filter(l => l.status === 'sold').length,
    rented: listings.filter(l => l.status === 'rented').length,
    completed: listings.filter(l => l.status === 'completed').length,
    expired: listings.filter(l => l.status === 'expired').length,
    totalViews: listings.reduce((sum, l) => sum + l.views_count, 0),
    totalFavorites: listings.reduce((sum, l) => sum + l.favorite_count, 0),
    totalConversations: listings.reduce((sum, l) => sum + l.conversation_count, 0)
  }

  return {
    listings,
    loading,
    error,
    stats,
    refetch: fetchListings,
    updateStatus: updateListingStatus,
    deleteListing,
    duplicateListing
  }
}

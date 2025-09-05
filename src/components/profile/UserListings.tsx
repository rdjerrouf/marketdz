// src/components/profile/UserListings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

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

interface UserListingsProps {
  userId: string
  isOwnProfile: boolean
}

export default function UserListings({ userId, isOwnProfile }: UserListingsProps) {
  const router = useRouter()
  const [listings, setListings] = useState<ListingWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  useEffect(() => {
    fetchListings()
  }, [userId, selectedStatus, selectedCategory])

  const fetchListings = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Enhanced query with stats
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

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus as ListingWithStats['status'])
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as ListingWithStats['category'])
      }

      const { data, error } = await query

      if (error) throw error

      // Ensure data exists and handle stats
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

    } catch (error) {
      console.error('Error fetching listings:', error)
      setError('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (listingId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(listingId)
      
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus as ListingWithStats['status'] })
        .eq('id', listingId)

      if (error) throw error

      // Update local state
      setListings(prev => prev.map(listing =>
        listing.id === listingId
          ? { ...listing, status: newStatus as ListingWithStats['status'] }
          : listing
      ))

    } catch (error) {
      console.error('Error updating status:', error)
      setError('Failed to update listing status')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(listingId)
      
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

      if (error) throw error

      setListings(prev => prev.filter(listing => listing.id !== listingId))

    } catch (error) {
      console.error('Error deleting listing:', error)
      setError('Failed to delete listing')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDuplicate = async (listing: ListingWithStats) => {
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

      fetchListings() // Refresh the list

    } catch (error) {
      console.error('Error duplicating listing:', error)
      setError('Failed to duplicate listing')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      sold: 'bg-blue-100 text-blue-800 border-blue-200',
      rented: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      expired: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || colors.active
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      for_sale: '🛒',
      for_rent: '🏠',
      job: '💼',
      service: '🔧'
    }
    return icons[category as keyof typeof icons] || '📦'
  }

  const statusCounts = listings.reduce((acc, listing) => {
    acc[listing.status] = (acc[listing.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {isOwnProfile ? 'My Listings' : 'Listings'}
        </h3>
        {isOwnProfile && (
          <Link
            href="/add-item"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            + Add New Listing
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selectedStatus === 'all'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedStatus('all')}
        >
          <div className="text-2xl font-bold text-gray-900">{listings.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        {['active', 'sold', 'rented', 'completed', 'expired'].map((status) => (
          <div
            key={status}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              selectedStatus === status
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedStatus(status)}
          >
            <div className="text-2xl font-bold text-gray-900">
              {statusCounts[status] || 0}
            </div>
            <div className="text-sm text-gray-600 capitalize">{status}</div>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Category
        </label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Categories</option>
          <option value="for_sale">For Sale</option>
          <option value="for_rent">For Rent</option>
          <option value="job">Jobs</option>
          <option value="service">Services</option>
        </select>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📦</div>
          <div className="text-xl font-semibold text-gray-900 mb-2">No listings found</div>
          <div className="text-gray-600">
            {isOwnProfile
              ? "You haven't created any listings yet. Start by adding your first listing!"
              : "This user hasn't created any listings yet."}
          </div>
          {isOwnProfile && (
            <Link
              href="/add-item"
              className="inline-block mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Create Your First Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative h-48 bg-gray-200">
                {listing.photos.length > 0 ? (
                  <img
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {getCategoryIcon(listing.category)}
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(listing.status)}`}>
                    {listing.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {listing.title}
                </h4>
                <div className="text-sm text-gray-600 mb-3">
                  <div className="capitalize">{listing.category.replace('_', ' ')}</div>
                  <div>{listing.location_city}, {listing.location_wilaya}</div>
                  {listing.price && (
                    <div className="font-semibold text-green-600">
                      {listing.price.toLocaleString()} DZD
                    </div>
                  )}
                </div>

                {/* Performance Stats */}
                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>👁️ {listing.views_count} views</span>
                  <span>❤️ {listing.favorite_count} favorites</span>
                  <span>💬 {listing.conversation_count} messages</span>
                </div>

                {/* Actions */}
                {isOwnProfile && (
                  <div className="space-y-2">
                    {/* Status Update */}
                    <label htmlFor={`status-${listing.id}`} className="sr-only">
                      Update listing status
                    </label>
                    <select
                      id={`status-${listing.id}`}
                      value={listing.status}
                      onChange={(e) => handleStatusUpdate(listing.id, e.target.value)}
                      disabled={updatingStatusId === listing.id}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="active">Active</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                      <option value="completed">Completed</option>
                      <option value="expired">Expired</option>
                    </select>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Link
                        href={`/edit-listing/${listing.id}`}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDuplicate(listing)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        disabled={deletingId === listing.id}
                        className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {deletingId === listing.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

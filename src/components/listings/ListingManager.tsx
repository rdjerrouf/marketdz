// src/components/listings/ListingManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { fixPhotoUrl } from '@/lib/storage'
import Link from 'next/link'

interface Listing {
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
}

interface ListingManagerProps {
  userId?: string
}

export default function ListingManager({ userId }: ListingManagerProps) {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchListings()
  }, [userId, selectedStatus])

  const fetchListings = async () => {
    try {
      setLoading(true)

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
          created_at,
          updated_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(100) // PERFORMANCE: Limit to 100 listings to prevent timeout at scale

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus as 'active' | 'sold' | 'rented' | 'completed' | 'expired')
      }

      const { data, error } = await query

      if (error) {
        setError('Failed to fetch listings')
        console.error('Error fetching listings:', error)
        return
      }

      setListings((data as any) || [])
    } catch (err) {
      setError('An error occurred while fetching listings')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    try {
      // Get the current session to include the JWT token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('You must be signed in to update listings')
      }
      
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Update local state
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: newStatus as any, updated_at: new Date().toISOString() }
            : listing
        )
      )
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update listing status')
    }
  }

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(listingId)
      
      // Get the current session to include the JWT token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('You must be signed in to delete listings')
      }
      
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete listing')
      }

      // Remove from local state
      setListings(prev => prev.filter(listing => listing.id !== listingId))
    } catch (err) {
      console.error('Error deleting listing:', err)
      setError('Failed to delete listing')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800 border-green-200',
      sold: 'bg-blue-100 text-blue-800 border-blue-200',
      rented: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      expired: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return badges[status as keyof typeof badges] || badges.active
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <span className="ml-3 text-white/80">Loading listings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">My Listings</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            aria-label="Filter by listing status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </select>
          
          <Link
            href="/add-item"
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-center"
          >
            + Add New Listing
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No listings found</h3>
          <p className="text-gray-500 mb-6">
            {selectedStatus === 'all' 
              ? "You haven't created any listings yet." 
              : `No listings found with status "${selectedStatus}".`}
          </p>
          <Link
            href="/add-item"
            className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Image */}
                  <div className="lg:w-48 h-48 lg:h-32 flex-shrink-0">
                    {listing.photos.length > 0 ? (
                      <img
                        src={fixPhotoUrl(listing.photos[0])}
                        alt={listing.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-4xl">{getCategoryIcon(listing.category)}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 truncate">
                          {listing.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {listing.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{listing.location_city}, {listing.location_wilaya}</span>
                          <span>👁 {listing.views_count}</span>
                          <span>❤️ {listing.favorites_count}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(listing.status)}`}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                        {listing.price && (
                          <span className="text-lg font-bold text-green-600">
                            {listing.price.toLocaleString()} DZD
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
                      <Link
                        href={`/browse/${listing.id}`}
                        className="px-4 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View
                      </Link>
                      
                      <Link
                        href={`/edit-listing/${listing.id}`}
                        className="px-4 py-2 text-sm border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Edit
                      </Link>

                      {listing.status === 'active' && (
                        <>
                          <select
                            value={listing.status}
                            onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                            className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            aria-label="Change listing status"
                          >
                            <option value="active">Active</option>
                            <option value="sold">Mark as Sold</option>
                            <option value="rented">Mark as Rented</option>
                            <option value="completed">Mark as Completed</option>
                            <option value="expired">Mark as Expired</option>
                          </select>
                        </>
                      )}

                      <button
                        onClick={() => handleDelete(listing.id)}
                        disabled={deletingId === listing.id}
                        className="px-4 py-2 text-sm border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        {deletingId === listing.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

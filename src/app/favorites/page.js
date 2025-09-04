'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import FavoriteButton from '@/components/common/FavoriteButton'

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }
      setUser(session.user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/signin')
    }
  }

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      
      // Get user's access token for API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch favorites')
      }

      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteRemoved = (listingId) => {
    // Remove the listing from favorites when unfavorited
    setFavorites(prev => prev.filter(fav => fav.listing_id !== listingId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Favorites</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        </div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Favorites</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              You haven't added any favorites yet. Browse listings and click the heart icon to save them here!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          My Favorites ({favorites.length})
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => {
            const listing = favorite.listing
            return (
              <div key={favorite.listing_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Listing Image */}
                {listing.photos && listing.photos.length > 0 ? (
                  <img
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                <div className="p-4">
                  {/* Title and Favorite Button */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 flex-1 mr-2"
                      onClick={() => router.push(`/browse/${listing.id}`)}
                    >
                      {listing.title}
                    </h3>
                    <FavoriteButton
                      listingId={listing.id}
                      listingOwnerId={listing.user_id}
                      onToggle={(isFavorited) => {
                        if (!isFavorited) {
                          handleFavoriteRemoved(listing.id)
                        }
                      }}
                    />
                  </div>

                  {/* Price */}
                  {listing.price && (
                    <p className="text-xl font-bold text-green-600 mb-2">
                      {listing.price.toLocaleString()} DA
                    </p>
                  )}

                  {/* Description */}
                  {listing.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {listing.description}
                    </p>
                  )}

                  {/* Category */}
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {listing.category?.replace('_', ' ')}
                  </span>

                  {/* Date Added */}
                  <p className="text-xs text-gray-500 mt-2">
                    Added to favorites: {new Date(favorite.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

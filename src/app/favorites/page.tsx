'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/contexts/AuthContext'
import FavoriteButton from '@/components/common/FavoriteButton'
import PWAInstallButton from '@/components/PWAInstallButton'
import { fixPhotoUrl } from '@/lib/storage'

export default function FavoritesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const { data: favoritesData, loading, error, refetch } = useFavorites(currentPage, 20)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin?redirect=/favorites')
    }
  }, [user, authLoading, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  const getCategoryInfo = (category: string) => {
    const categories = {
      for_sale: { emoji: '🛍️', text: 'For Sale', color: 'bg-blue-500' },
      for_rent: { emoji: '🏠', text: 'For Rent', color: 'bg-green-500' },
      job: { emoji: '💼', text: 'Job', color: 'bg-purple-500' },
      service: { emoji: '🔧', text: 'Service', color: 'bg-orange-500' }
    }
    return categories[category as keyof typeof categories] || { emoji: '📦', text: category, color: 'bg-gray-500' }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#06402B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#06402B] relative overflow-hidden">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce opacity-10"
          >
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header with PWA button outside the content area */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-white/80 transition-colors group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <PWAInstallButton />
        </div>
        
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-black">
              ❤️ My Favorites
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-100 rounded-lg p-4 mb-6">
              <p className="font-medium">Error loading favorites</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={refetch}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : !favoritesData || favoritesData.favorites.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💔</div>
              <h2 className="text-2xl font-bold text-white mb-2">No favorites</h2>
              <p className="text-purple-200 mb-6">
                You haven't added any listings to your favorites yet.
              </p>
              <button
                onClick={() => router.push('/browse')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 font-medium"
              >
                Browse listings
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-black">
                  {favoritesData.pagination.totalItems} listing{favoritesData.pagination.totalItems > 1 ? 's' : ''} in your favorites
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritesData.favorites.map((favorite) => {
                  const { listing } = favorite
                  const categoryInfo = getCategoryInfo(listing.category)
                  
                  return (
                    <div
                      key={favorite.favoriteId}
                      className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 overflow-hidden hover:bg-opacity-20 transition-all duration-200 cursor-pointer group"
                      onClick={(e) => {
                        // Don't navigate if clicking on favorite button or its children
                        const target = e.target as HTMLElement
                        if (target.closest('[data-favorite-button]')) {
                          console.log('🚫 Card click ignored - clicked on favorite button')
                          return
                        }
                        router.push(`/browse/${listing.id}`)
                      }}
                    >
                      <div className="relative">
                        {listing.photos && listing.photos.length > 0 ? (
                          <img
                            src={fixPhotoUrl(listing.photos[0])}
                            alt={listing.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-4xl">📷</span>
                          </div>
                        )}
                        
                        <div className="absolute top-2 left-2 flex flex-col gap-2">
                          <span className={`${categoryInfo.color} text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg`}>
                            {categoryInfo.emoji} {categoryInfo.text}
                          </span>
                          {listing.status !== 'active' && (
                            <span className={`
                              ${listing.status === 'sold' ? 'bg-green-600' : ''}
                              ${listing.status === 'rented' ? 'bg-blue-600' : ''}
                              ${listing.status === 'completed' ? 'bg-gray-600' : ''}
                              ${listing.status === 'expired' ? 'bg-red-600' : ''}
                              text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg uppercase
                            `}>
                              {listing.status === 'sold' && '✓ Sold'}
                              {listing.status === 'rented' && '✓ Rented'}
                              {listing.status === 'completed' && '✓ Completed'}
                              {listing.status === 'expired' && '⏰ Expired'}
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2 right-2 flex items-center space-x-2 z-10 pointer-events-auto">
                          <div
                            data-favorite-button="true"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <FavoriteButton
                              listingId={listing.id}
                              listingOwnerId={listing.user_id}
                              size="sm"
                              className="bg-white bg-opacity-90 hover:bg-white shadow-lg"
                              onToggle={(isFavorited) => {
                                if (!isFavorited) {
                                  // Refresh the favorites list when an item is removed
                                  refetch()
                                }
                              }}
                            />
                          </div>
                          <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs shadow-lg">
                            {getTimeAgo(favorite.favoritedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 group-hover:text-gray-200 transition-colors">
                          {listing.title}
                        </h3>
                        
                        <p className="text-black text-sm mb-3 line-clamp-2">
                          {listing.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div>
                            {listing.price && (
                              <p className="text-2xl font-bold text-white">
                                {formatPrice(listing.price)}
                              </p>
                            )}
                            <p className="text-black text-sm">
                              {listing.wilaya}, {listing.city}
                            </p>
                          </div>
                        </div>

                        {/* User Info */}
                        {listing.user && (
                          <div className="flex items-center mt-3 pt-3 border-t border-white border-opacity-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (listing.user?.id) {
                                  router.push(`/profile/${listing.user.id}`)
                                }
                              }}
                              className="flex items-center hover:bg-white hover:bg-opacity-10 rounded-lg p-1 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-2">
                                {listing.user.avatar_url ? (
                                  <img
                                    src={listing.user.avatar_url}
                                    alt={`${listing.user.first_name} ${listing.user.last_name}`}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white text-xs font-bold">
                                    {listing.user.first_name?.[0]}{listing.user.last_name?.[0]}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm">
                                <span className="text-black">By {listing.user.first_name} {listing.user.last_name}</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {favoritesData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center mt-8 space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!favoritesData.pagination.hasPreviousPage}
                    className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-30 transition-all"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-white">
                    Page {currentPage} of {favoritesData.pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!favoritesData.pagination.hasNextPage}
                    className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-30 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

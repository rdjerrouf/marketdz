// src/app/browse/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface Listing {
  id: string
  title: string
  description: string | null
  price: number | null
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  photos: string[]
  created_at: string
  status: string
  user_id: string
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
}

interface Seller {
  id: string
  first_name: string
  last_name: string
  created_at: string
}

export default function ListingDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [seller, setSeller] = useState<Seller | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showContactInfo, setShowContactInfo] = useState(false)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser({
            id: profile.id,
            email: session.user.email || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          })
        }
      }
    }

    checkAuth()
  }, [])

  // Fetch listing details
  useEffect(() => {
    const fetchListing = async () => {
      try {
        console.log('Fetching listing:', listingId)

        // Fetch listing data
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single()

        if (listingError) {
          console.error('Error fetching listing:', listingError)
          setError('Listing not found')
          return
        }

        if (!listingData) {
          setError('Listing not found')
          return
        }

        console.log('Listing data:', listingData)
        setListing(listingData)

        // Fetch seller profile
        const { data: sellerData, error: sellerError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, created_at')
          .eq('id', listingData.user_id)
          .single()

        if (sellerError) {
          console.error('Error fetching seller:', sellerError)
        } else {
          console.log('Seller data:', sellerData)
          setSeller(sellerData)
        }

      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      fetchListing()
    }
  }, [listingId])

  const formatPrice = (price: number | null, category: string) => {
    if (!price) return category === 'job' ? 'Salary negotiable' : 'Price negotiable'
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getCategoryInfo = (category: string) => {
    const categories = {
      'for_sale': { text: 'For Sale', color: 'bg-green-500', emoji: '💰' },
      'for_rent': { text: 'For Rent', color: 'bg-blue-500', emoji: '🏠' },
      'job': { text: 'Jobs', color: 'bg-red-500', emoji: '💼' },
      'service': { text: 'Services', color: 'bg-purple-500', emoji: '🔧' }
    }
    return categories[category as keyof typeof categories] || { text: category, color: 'bg-gray-500', emoji: '📦' }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const nextImage = () => {
    if (listing?.photos && listing.photos.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.photos.length)
    }
  }

  const previousImage = () => {
    if (listing?.photos && listing.photos.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.photos.length) % listing.photos.length)
    }
  }

  const handleContactSeller = () => {
    if (!user) {
      router.push('/signin?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    setShowContactInfo(true)
  }

  const handleMessageSeller = () => {
    if (!user) {
      router.push('/signin?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    // TODO: Implement chat functionality
    alert('Chat feature coming soon!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{error || 'Listing not found'}</h2>
          <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/browse')}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Browse All Listings
          </button>
        </div>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(listing.category)
  const isOwner = user?.id === listing.user_id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Listings
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Go to homepage"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>

              {user && (
                <button 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Add to favorites"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {listing.photos && listing.photos.length > 0 ? (
                <div className="relative">
                  <div className="aspect-video bg-gray-200">
                    <img
                      src={listing.photos[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Image Navigation */}
                  {listing.photos.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                        aria-label="Previous image"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                        aria-label="Next image"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {listing.photos.length}
                      </div>
                    </>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`${categoryInfo.color} text-white px-4 py-2 rounded-full font-medium`}>
                      {categoryInfo.emoji} {categoryInfo.text}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No photos available</p>
                  </div>
                </div>
              )}

              {/* Thumbnail Strip */}
              {listing.photos && listing.photos.length > 1 && (
                <div className="p-4 border-t">
                  <div className="flex space-x-2 overflow-x-auto">
                    {listing.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          currentImageIndex === index ? 'border-green-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`${listing.title} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            </div>

            {/* Listing Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Listing Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Category:</span>
                  <p className="text-gray-900">{categoryInfo.text}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Posted:</span>
                  <p className="text-gray-900">{getTimeAgo(listing.created_at)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Listing ID:</span>
                  <p className="text-gray-900 font-mono">{listing.id.slice(-8)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <p className="text-gray-900 capitalize">{listing.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Price and Seller Info */}
          <div className="space-y-6">
            {/* Price and Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                <div className="text-3xl font-bold text-green-600 mb-4">
                  {formatPrice(listing.price, listing.category)}
                </div>
              </div>

              {!isOwner && (
                <div className="space-y-3">
                  <button
                    onClick={handleContactSeller}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Contact Seller
                  </button>
                  
                  <button
                    onClick={handleMessageSeller}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              )}

              {isOwner && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-green-800 font-medium">This is your listing</p>
                  </div>
                  <button
                    onClick={() => router.push(`/add-item/edit/${listing.id}`)}
                    className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Edit Listing
                  </button>
                </div>
              )}
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
              
              {seller ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-semibold text-lg">
                        {seller.first_name?.[0] || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {seller.first_name} {seller.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Member since {new Date(seller.created_at).getFullYear()}
                      </p>
                    </div>
                  </div>

                  {showContactInfo && !isOwner && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Contact Information</h4>
                      <p className="text-blue-800 text-sm mb-2">
                        Please be respectful when contacting the seller.
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-blue-900">
                          <span className="font-medium">Name:</span> {seller.first_name} {seller.last_name}
                        </p>
                        <p className="text-blue-700">
                          Use the "Send Message" button to contact this seller safely through our platform.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Safety Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Safety Tips</h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>• Meet in a public place for transactions</li>
                <li>• Don't send money before seeing the item</li>
                <li>• Trust your instincts</li>
                <li>• Report suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getAllCategories } from '@/lib/constants/categories'

interface Listing {
  id: string
  title: string
  description: string
  price: number | null
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  photos: string[]
  created_at: string
  location: {
    wilaya: string
    city: string
  }
  profiles: {
    first_name: string
    last_name: string
  }[]
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([])
  const [stats, setStats] = useState({
    totalListings: 0,
    hotDeals: 0,
    newToday: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Fetch user profile
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

  // Fetch featured listings and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured listings (latest 6)
        const { data: listings } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            description,
            price,
            category,
            photos,
            created_at,
            location,
            profiles (
              first_name,
              last_name
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6)

        setFeaturedListings(listings || [])

        // Fetch stats
        const { count: totalCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        const { count: newTodayCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('created_at', new Date().toISOString().split('T')[0])

        const { count: hotDealsCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('price', 'is', null)
          .lte('price', 50000) // Hot deals under 50k DZD

        setStats({
          totalListings: totalCount || 0,
          hotDeals: hotDealsCount || 0,
          newToday: newTodayCount || 0
        })
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/browse')
    }
  }

  const handleCategoryClick = (category: string) => {
    router.push(`/browse?category=${category}`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }

  const formatPrice = (price: number | null, category: string) => {
    if (!price) return category === 'job' ? 'Salary negotiable' : 'Price negotiable'
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getCategoryBadge = (category: string) => {
    const badges = {
      'for_sale': { text: 'For Sale', color: 'bg-green-500' },
      'for_rent': { text: 'For Rent', color: 'bg-blue-500' },
      'job': { text: 'Jobs', color: 'bg-red-500' },
      'service': { text: 'Services', color: 'bg-purple-500' }
    }
    return badges[category as keyof typeof badges] || { text: category, color: 'bg-gray-500' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="text-white text-xl font-bold">MarketDZ</h1>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center w-full p-3 text-white bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </button>

            <button 
              onClick={() => router.push('/browse')}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Listings
            </button>

            <button 
              onClick={() => router.push('/add-item')}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Listing
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">NEW</span>
            </button>

            <button 
              onClick={() => router.push('/browse')}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>

            <button className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorites
              <span className="ml-auto bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">3</span>
            </button>

            <button className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </button>

            <button 
              onClick={() => router.push('/profile')}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>

            <div className="pt-4 border-t border-white border-opacity-20 mt-4">
              {user ? (
                <button 
                  onClick={handleSignOut}
                  className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => router.push('/signin')}
                    className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors mb-2"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </button>
                  <button 
                    onClick={() => router.push('/signup')}
                    className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* User Info at Bottom */}
        {user && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white bg-opacity-10 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">
                    {user.first_name[0]}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-white text-opacity-70 text-xs">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            <span className="text-2xl">DZ</span> MarketDZ
          </h1>
          <p className="text-xl text-white text-opacity-90">
            Algeria's Premier Online Marketplace
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex">
            <input
              type="text"
              placeholder="Search for anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-6 py-4 text-lg rounded-l-full border-none outline-none shadow-lg"
            />
            <button
              onClick={handleSearch}
              className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-r-full hover:bg-orange-600 transition-colors shadow-lg"
            >
              🔍 Search
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex justify-center space-x-4 mb-12">
          <button
            onClick={() => handleCategoryClick('for_sale')}
            className="px-6 py-3 bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 font-semibold rounded-full hover:bg-opacity-100 transition-colors flex items-center shadow-lg"
          >
            💰 For Sale
          </button>
          <button
            onClick={() => handleCategoryClick('for_rent')}
            className="px-6 py-3 bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 font-semibold rounded-full hover:bg-opacity-100 transition-colors flex items-center shadow-lg"
          >
            🏠 For Rent
          </button>
          <button
            onClick={() => handleCategoryClick('job')}
            className="px-6 py-3 bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 font-semibold rounded-full hover:bg-opacity-100 transition-colors flex items-center shadow-lg"
          >
            💼 Jobs
          </button>
          <button
            onClick={() => handleCategoryClick('service')}
            className="px-6 py-3 bg-white bg-opacity-90 backdrop-blur-sm text-gray-800 font-semibold rounded-full hover:bg-opacity-100 transition-colors flex items-center shadow-lg"
          >
            🔧 Services
          </button>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {stats.totalListings}+
              </div>
              <div className="text-gray-600 font-medium">Active Listings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2 flex items-center justify-center">
                {stats.hotDeals} 🔥
              </div>
              <div className="text-gray-600 font-medium">Hot Deals</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-2 flex items-center justify-center">
                {stats.newToday} <span className="ml-2 bg-blue-500 text-white text-sm px-2 py-1 rounded-full">NEW</span>
              </div>
              <div className="text-gray-600 font-medium">New Today</div>
            </div>
          </div>
        </div>

        {/* Featured Listings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center">
              ⭐ Featured Listings
            </h2>
            <button
              onClick={() => router.push('/browse')}
              className="text-white hover:text-opacity-80 font-medium"
            >
              View All →
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => {
                const badge = getCategoryBadge(listing.category)
                return (
                  <div
                    key={listing.id}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => router.push(`/browse/${listing.id}`)}
                  >
                    {/* Image */}
                    <div className="h-48 bg-gray-200 relative">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`${badge.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                          {badge.text}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 truncate">
                        {listing.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-600">
                          {formatPrice(listing.price, listing.category)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {listing.location?.city}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && featuredListings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-white text-opacity-60 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No listings yet</h3>
              <p className="text-white text-opacity-60 mb-4">Be the first to create a listing!</p>
              <button
                onClick={() => router.push('/add-item')}
                className="bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition-colors"
              >
                Create Listing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// src/app/browse/page.tsx - Compatible with current API
'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ALGERIA_WILAYAS } from '@/lib/constants/algeria'
import FavoriteButton from '@/components/common/FavoriteButton'

interface Listing {
  id: string
  title: string
  description: string
  price: number | null
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  photos: string[]
  created_at: string
  status: string
  user_id: string
  wilaya?: string
  city?: string
  search_rank?: number
  user?: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string
  } | null
}

interface SearchFilters {
  query: string
  category: string
  wilaya: string
  city: string
  minPrice: string
  maxPrice: string
  sortBy: 'relevance' | 'newest' | 'oldest' | 'price_low' | 'price_high'
}

// Updated to match our API response structure
interface SearchResponse {
  listings: Listing[]  // Changed from 'results' to 'listings'
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number  // Changed from 'totalResults'
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  filters: any
}

function BrowsePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,  // Changed from totalResults
    hasNextPage: false,
    hasPreviousPage: false
  })

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('search') || searchParams.get('query') || searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    wilaya: searchParams.get('wilaya') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: (searchParams.get('sortBy') as any) || 'relevance'
  })

  // Memoized cities list based on selected wilaya
  const availableCities = useMemo(() => {
    if (!filters.wilaya) return []
    const wilaya = ALGERIA_WILAYAS.find((w: any) => w.code === filters.wilaya || w.name === filters.wilaya)
    return wilaya ? wilaya.cities : []
  }, [filters.wilaya])

  // Reset city when wilaya changes
  useEffect(() => {
    if (filters.wilaya && filters.city && availableCities.length > 0 && !availableCities.includes(filters.city)) {
      setFilters(prev => ({ ...prev, city: '' }))
    }
  }, [filters.wilaya, filters.city, availableCities])

  // Map sortBy values to API expected values
  const mapSortBy = (sortBy: string) => {
    const mapping: Record<string, string> = {
      'relevance': 'created_at',
      'newest': 'created_at',
      'oldest': 'created_at',
      'price_low': 'price_asc',
      'price_high': 'price_desc'
    }
    return mapping[sortBy] || 'created_at'
  }

  // Debounced search function
  const performSearch = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      // Build query parameters to match our API
      const queryParams = new URLSearchParams()
      
      if (filters.query.trim()) queryParams.set('q', filters.query.trim())
      if (filters.category) queryParams.set('category', filters.category)
      if (filters.wilaya) queryParams.set('wilaya', filters.wilaya)
      if (filters.city) queryParams.set('city', filters.city)
      if (filters.minPrice && !isNaN(Number(filters.minPrice))) {
        queryParams.set('minPrice', filters.minPrice)
      }
      if (filters.maxPrice && !isNaN(Number(filters.maxPrice))) {
        queryParams.set('maxPrice', filters.maxPrice)
      }
      queryParams.set('sortBy', mapSortBy(filters.sortBy))
      queryParams.set('page', page.toString())
      queryParams.set('limit', '20')

      console.log('Searching with params:', queryParams.toString())

      const response = await fetch(`/api/search?${queryParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data: SearchResponse = await response.json()
      console.log('Search response:', data)
      // Add this temporarily after line 136 where you log "Search response: Object"
console.log('Search response details:', JSON.stringify(data, null, 2))
      // Handle successful response
      if (page === 1) {
        setListings(data.listings || [])  // Added fallback to empty array
      } else {
        // Append results for "load more" functionality
        setListings(prev => [...prev, ...(data.listings || [])])
      }
      
      setPagination({
        currentPage: data.pagination?.currentPage || page,
        totalPages: data.pagination?.totalPages || 1,
        totalItems: data.pagination?.totalItems || 0,  // Changed from totalResults
        hasNextPage: data.pagination?.hasNextPage || false,
        hasPreviousPage: data.pagination?.hasPreviousPage || false
      })

      // Update URL without page reload for better UX
      const newUrl = new URL(window.location.href)
      newUrl.search = queryParams.toString()
      window.history.replaceState({}, '', newUrl.toString())

    } catch (err) {
      console.error('Search failed:', err)
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.')
      
      // Reset results on error
      if (page === 1) {
        setListings([])
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false
        })
      }
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Load initial results and when filters change
  useEffect(() => {
    performSearch(1)
  }, [performSearch])

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      wilaya: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'relevance'
    })
  }

  const loadMoreResults = () => {
    if (!loading && pagination.hasNextPage) {
      performSearch(pagination.currentPage + 1)
    }
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
      'for_sale': { text: 'For Sale', color: 'bg-green-500', emoji: '💰' },
      'for_rent': { text: 'For Rent', color: 'bg-blue-500', emoji: '🏠' },
      'job': { text: 'Jobs', color: 'bg-red-500', emoji: '💼' },
      'service': { text: 'Services', color: 'bg-purple-500', emoji: '🔧' }
    }
    return badges[category as keyof typeof badges] || { text: category, color: 'bg-gray-500', emoji: '📦' }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:4s]"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[
            { left: 'left-[10%]', top: 'top-[20%]', opacity: 'opacity-10' },
            { left: 'left-[25%]', top: 'top-[15%]', opacity: 'opacity-20' },
            { left: 'left-[40%]', top: 'top-[30%]', opacity: 'opacity-30' },
            { left: 'left-[60%]', top: 'top-[10%]', opacity: 'opacity-40' },
            { left: 'left-[80%]', top: 'top-[25%]', opacity: 'opacity-50' }
          ].map((particle, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-white/10 rounded-full animate-pulse ${particle.left} ${particle.top} ${particle.opacity}`}
            />
          ))}
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="relative z-10 w-64 bg-slate-900/90 backdrop-blur-sm border-r border-white/10">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="bg-purple-600/30 p-2 rounded-lg mr-3">
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
              className="flex items-center w-full p-3 text-gray-300 rounded-lg hover:bg-purple-600/20 hover:text-white transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </button>

            <div className="flex items-center w-full p-3 text-white bg-purple-600/30 rounded-lg border border-purple-400/30">
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search & Browse
            </div>

            <button 
              onClick={() => router.push('/add-item')}
              className="flex items-center w-full p-3 text-gray-300 rounded-lg hover:bg-purple-600/20 hover:text-white transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Listing
            </button>

            <button 
              onClick={() => router.push('/favorites')}
              className="flex items-center w-full p-3 text-gray-300 rounded-lg hover:bg-purple-600/20 hover:text-white transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorites
            </button>

            <button 
              onClick={() => router.push('/profile')}
              className="flex items-center w-full p-3 text-gray-300 rounded-lg hover:bg-purple-600/20 hover:text-white transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Search MarketDZ</h1>
          <p className="text-lg text-white text-opacity-90">
            Find exactly what you're looking for in Algeria's premier marketplace
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-xl">
          <form onSubmit={(e) => { e.preventDefault(); performSearch(1); }}>
            {/* Search Query */}
            <div className="mb-6">
              <label htmlFor="search-query" className="block text-sm font-semibold text-gray-700 mb-2">
                What are you looking for?
              </label>
              <input
                id="search-query"
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder="Search for items, jobs, services..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Category */}
              <div>
                <label htmlFor="category-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category-select"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">All Categories</option>
                  <option value="for_sale">For Sale</option>
                  <option value="for_rent">For Rent</option>
                  <option value="job">Jobs</option>
                  <option value="service">Services</option>
                </select>
              </div>

              {/* Wilaya */}
              <div>
                <label htmlFor="wilaya-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  Wilaya
                </label>
                <select
                  id="wilaya-select"
                  value={filters.wilaya}
                  onChange={(e) => handleFilterChange('wilaya', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">All Wilayas</option>
                  {ALGERIA_WILAYAS.map((wilaya: any) => (
                    <option key={wilaya.code} value={wilaya.name}>
                      {wilaya.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label htmlFor="city-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  City
                </label>
                <select
                  id="city-select"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  disabled={!filters.wilaya}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">
                    {filters.wilaya ? 'All Cities' : 'Select Wilaya First'}
                  </option>
                  {availableCities.map((city: string) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label htmlFor="sort-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  id="sort-select"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="min-price" className="block text-sm font-semibold text-gray-700 mb-2">
                  Min Price (DA)
                </label>
                <input
                  id="min-price"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="max-price" className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Price (DA)
                </label>
                <input
                  id="max-price"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="No limit"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  'Search Listings'
                )}
              </button>
              
              <button
                type="button"
                onClick={clearFilters}
                disabled={loading}
                className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {loading && pagination.totalItems === 0 ? 'Searching...' : 
                 error ? 'Search Error' : 
                 `Search Results`}
              </h2>
              {!loading && !error && (
                <p className="text-gray-600 mt-1">
                  {pagination.totalItems === 0 ? 
                    'No listings found' : 
                    `${pagination.totalItems} ${pagination.totalItems === 1 ? 'listing' : 'listings'} found`}
                  {filters.query && ` for "${filters.query}"`}
                </p>
              )}
            </div>

            {/* Results Info */}
            {!loading && !error && pagination.totalItems > 0 && (
              <div className="text-sm text-gray-500">
                Showing {((pagination.currentPage - 1) * 20) + 1}-{Math.min(pagination.currentPage * 20, pagination.totalItems)} of {pagination.totalItems}
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Search Failed</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={() => performSearch(1)}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (!listings ||  (listings || []).length === 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && (!listings ||  (listings || []).length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {Object.values(filters).some(f => f) ? 'No Results Found' : 'Start Your Search'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
                  : 'Enter search terms or use filters to discover amazing listings from across Algeria.'
                }
              </p>
              {Object.values(filters).some(f => f) ? (
                <button
                  onClick={clearFilters}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleFilterChange('query', '')
                    performSearch(1)
                  }}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Browse All Listings
                </button>
              )}
            </div>
          )}

          {/* Results Grid - Fixed the error line 512 issue */}
          {!loading && !error && listings &&  (listings || []).length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map((listing) => {
                  const categoryBadge = getCategoryBadge(listing.category)
                  
                  return (
                    <div
                      key={listing.id}
                      className="border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-green-300 transition-all duration-200 cursor-pointer group"
                      onClick={() => router.push(`/browse/${listing.id}`)}
                    >
                      {/* Image */}
                      <div className="h-48 bg-gray-200 relative overflow-hidden">
                        {listing.photos && listing.photos.length > 0 ? (
                          <img
                            src={listing.photos[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgODBDMTA0LjQxOCA4MCAxMDggODMuNTgyIDEwOCA4OFYxMTJDMTA4IDExNi40MTggMTA0LjQxOCAxMjAgMTAwIDEyMEM5NS41ODIgMTIwIDkyIDExNi40MTggOTIgMTEyVjg4QzkyIDgzLjU4MiA5NS41ODIgODAgMTAwIDgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2">
                          <span className={`${categoryBadge.color} text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg`}>
                            {categoryBadge.emoji} {categoryBadge.text}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2 flex items-center space-x-2">
                          <FavoriteButton 
                            listingId={listing.id}
                            size="sm"
                            className="bg-white bg-opacity-90 hover:bg-white shadow-lg"
                          />
                          <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs shadow-lg">
                            {getTimeAgo(listing.created_at)}
                          </span>
                        </div>

                        {/* Location Badge */}
                        {(listing.city || listing.wilaya) && (
                          <div className="absolute bottom-2 left-2">
                            <span className="bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded-full text-xs font-medium shadow">
                              {listing.city ? `${listing.city}${listing.wilaya ? `, ${listing.wilaya}` : ''}` : listing.wilaya}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-green-600 transition-colors">
                          {listing.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                          {listing.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-600 text-lg">
                            {formatPrice(listing.price, listing.category)}
                          </span>
                          
                          {listing.search_rank && listing.search_rank > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Match
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        {listing.user && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center text-sm text-gray-600">
                              {listing.user.avatar_url ? (
                                <img
                                  src={listing.user.avatar_url}
                                  alt={`${listing.user.first_name} ${listing.user.last_name}`}
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                                  <span className="text-xs text-gray-600">
                                    {listing.user.first_name?.[0]}{listing.user.last_name?.[0]}
                                  </span>
                                </div>
                              )}
                              <span>By {listing.user.first_name} {listing.user.last_name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Load More Button */}
              {pagination.hasNextPage && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMoreResults}
                    disabled={loading}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Loading More...
                      </>
                    ) : (
                      `Load More (${pagination.totalItems - listings.length} remaining)`
                    )}
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              <div className="text-center mt-6 text-sm text-gray-500">
                {pagination.totalPages > 1 && (
                  <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ImprovedSearchBrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <BrowsePageContent />
    </Suspense>
  )
}
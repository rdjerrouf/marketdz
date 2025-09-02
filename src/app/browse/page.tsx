// src/app/browse/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getAllCategories, getCategoryByValue } from '@/lib/constants/categories'
import { ALGERIA_WILAYAS } from '@/lib/constants/algeria'

interface Listing {
  id: string
  title: string
  description: string
  price: number | null
  category: 'for_sale' | 'job' | 'service' | 'for_rent'
  status: string
  location: {
    wilaya: string
    city: string
  }
  photos: string[]
  created_at: string
  user_id?: string
  profiles: {
    first_name: string
    last_name: string
    avatar_url: string | null
  }[] | null
}

interface Filters {
  category: string
  wilaya: string
  minPrice: string
  maxPrice: string
  searchQuery: string
}

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Filters>({
    category: '',
    wilaya: '',
    minPrice: '',
    maxPrice: '',
    searchQuery: ''
  })

  // Fetch listings from Supabase
  const fetchListings = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      
      if (filters.wilaya) {
        query = query.eq('location->>wilaya', filters.wilaya)
      }

      if (filters.minPrice && !isNaN(Number(filters.minPrice))) {
        query = query.gte('price', Number(filters.minPrice))
      }

      if (filters.maxPrice && !isNaN(Number(filters.maxPrice))) {
        query = query.lte('price', Number(filters.maxPrice))
      }

      if (filters.searchQuery.trim()) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
      }

      const { data, error } = await query.limit(20)

      if (error) throw error

      setListings(data || [])
    } catch (err) {
      console.error('Error fetching listings:', err)
      setError('Failed to load listings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load listings on component mount and when filters change
  useEffect(() => {
    fetchListings()
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      wilaya: '',
      minPrice: '',
      maxPrice: '',
      searchQuery: ''
    })
  }

  const formatPrice = (price: number | null, category: string) => {
    if (!price) return category === 'job' ? 'Salary negotiable' : 'Price negotiable'
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getCategoryLabel = (category: string) => {
    const cat = getCategoryByValue(category)
    return cat ? cat.label : category
  }

  const getWilayaLabel = (wilayaCode: string) => {
    const wilaya = ALGERIA_WILAYAS.find((w: any) => w.code === wilayaCode)
    return wilaya ? wilaya.name : wilayaCode
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Browse Marketplace</h1>
            <p className="mt-2 text-gray-600">Discover items, jobs, services, and rentals in Algeria</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                  aria-label="Clear all filters"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search listings..."
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category-filter"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All categories</option>
                    {getAllCategories().map((category: any) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="wilaya-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Wilaya
                  </label>
                  <select
                    id="wilaya-filter"
                    value={filters.wilaya}
                    onChange={(e) => handleFilterChange('wilaya', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All wilayas</option>
                    {ALGERIA_WILAYAS.map((wilaya: any) => (
                      <option key={wilaya.code} value={wilaya.code}>
                        {wilaya.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (DZD)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      id="min-price"
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      aria-label="Minimum price"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      id="max-price"
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      aria-label="Maximum price"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-8 lg:mt-0 lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${listings.length} listings found`}
              </p>
              
              <label htmlFor="sort-select" className="sr-only">Sort listings</label>
              <select 
                id="sort-select"
                aria-label="Sort listings"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Listings Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-600">Try adjusting your filters or check back later for new listings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                    {/* Image */}
                    <div className="h-48 bg-gray-200 rounded-t-lg relative">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img
                          src={listing.photos[0]}
                          alt={`${listing.title} - Main photo`}
                          className="w-full h-full object-cover rounded-t-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryLabel(listing.category)}
                        </span>
                      </div>
                      
                      {/* Photos Count */}
                      {listing.photos && listing.photos.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {listing.photos.length} photos
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {listing.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(listing.price, listing.category)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{getWilayaLabel(listing.location?.wilaya)}</span>
                        <span>{getRelativeTime(listing.created_at)}</span>
                      </div>
                      
                      {/* Seller Info */}
                      <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                          {listing.profiles?.[0]?.avatar_url ? (
                            <img
                              src={listing.profiles[0].avatar_url}
                              alt={`${listing.profiles[0].first_name} ${listing.profiles[0].last_name} avatar`}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <span className="text-xs text-gray-600" aria-label={`${listing.profiles?.[0]?.first_name} ${listing.profiles?.[0]?.last_name} initial`}>
                              {listing.profiles?.[0]?.first_name?.[0] || '?'}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          {listing.profiles?.[0]?.first_name || 'Unknown'} {listing.profiles?.[0]?.last_name || 'User'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
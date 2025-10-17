// src/app/browse/page.tsx - Compatible with current API
'use client'

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ALGERIA_WILAYAS } from '@/lib/constants/algeria'
import FavoriteButton from '@/components/common/FavoriteButton'
import StarRating from '@/components/common/StarRating'
import PWAInstallButton from '@/components/PWAInstallButton'
import MobileListingCard from '@/components/common/MobileListingCard'
import { fixPhotoUrl } from '@/lib/utils'

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
    rating: number
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
  filters: Record<string, unknown>
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

  // Add search cache for identical queries
  const searchCache = useRef<Map<string, { data: SearchResponse; expiresAt: number }>>(new Map())
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const abortController = useRef<AbortController | null>(null)
  const loadMoreThrottle = useRef<number>(0)
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache
  const LOAD_MORE_THROTTLE_MS = 1000 // 1 second throttle

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

  // Create cache key from search parameters (without timestamp for better caching)
  const createCacheKey = useCallback((searchFilters: SearchFilters, page: number) => {
    return JSON.stringify({
      ...searchFilters,
      page
    })
  }, [])

  // Immediate search function (without debounce) for direct calls
  const performSearchImmediate = useCallback(async (page: number = 1) => {
    // Cancel any previous request
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      // Check cache first
      const cacheKey = createCacheKey(filters, page)
      const cached = searchCache.current.get(cacheKey)

      if (cached && Date.now() < cached.expiresAt) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Using cached search results')
        }
        const data = cached.data

        if (page === 1) {
          setListings(data.listings || [])
        } else {
          setListings(prev => [...prev, ...(data.listings || [])])
        }

        setPagination({
          currentPage: data.pagination?.currentPage || page,
          totalPages: data.pagination?.totalPages || 1,
          totalItems: data.pagination?.totalItems || 0,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPreviousPage: data.pagination?.hasPreviousPage || false
        })

        setLoading(false)
        return
      }

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

      // Reduced logging for production performance
      if (process.env.NODE_ENV === 'development') {
        console.log('Searching with params:', queryParams.toString())
      }

      const response = await fetch(`/api/search?${queryParams.toString()}`, {
        signal: abortController.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data: SearchResponse = await response.json()

      // Cache the result (only for page 1 to keep cache manageable)
      if (page === 1) {
        searchCache.current.set(cacheKey, {
          data,
          expiresAt: Date.now() + CACHE_TTL
        })

        // Clean old cache entries (keep max 50 entries)
        if (searchCache.current.size > 50) {
          const oldestKey = searchCache.current.keys().next().value
          if (oldestKey) {
            searchCache.current.delete(oldestKey)
          }
        }
      }

      // Handle successful response
      if (page === 1) {
        setListings(data.listings || [])
      } else {
        setListings(prev => [...prev, ...(data.listings || [])])
      }

      setPagination({
        currentPage: data.pagination?.currentPage || page,
        totalPages: data.pagination?.totalPages || 1,
        totalItems: data.pagination?.totalItems || 0,
        hasNextPage: data.pagination?.hasNextPage || false,
        hasPreviousPage: data.pagination?.hasPreviousPage || false
      })

      // Update URL without page reload for better UX
      const newUrl = new URL(window.location.href)
      newUrl.search = queryParams.toString()
      window.history.replaceState({}, '', newUrl.toString())

    } catch (err) {
      // Don't show error for aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

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
  }, [filters, createCacheKey, CACHE_TTL])

  // Debounced search function - 300ms delay as suggested by AI
  const performSearch = useCallback((page: number = 1) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      performSearchImmediate(page)
    }, 300) // 300ms debounce as recommended
  }, [performSearchImmediate])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  // Load initial results and when filters change
  useEffect(() => {
    performSearch(1)
  }, [performSearch])

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

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

  const loadMoreResults = useCallback(() => {
    const now = Date.now()

    // Throttle rapid pagination calls
    if (now - loadMoreThrottle.current < LOAD_MORE_THROTTLE_MS) {
      return
    }

    if (!loading && pagination.hasNextPage) {
      loadMoreThrottle.current = now
      // Use immediate search for pagination (no debounce needed)
      performSearchImmediate(pagination.currentPage + 1)
    }
  }, [loading, pagination.hasNextPage, pagination.currentPage, performSearchImmediate, LOAD_MORE_THROTTLE_MS])

  const formatPrice = (price: number | null, category: string) => {
    if (!price) return category === 'job' ? 'Salary negotiable' : 'Price negotiable'
    return new Intl.NumberFormat('en-US', {
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

  const getDefaultImage = (category: string) => {
    // SVG data URLs for default category images
    const defaults: Record<string, string> = {
      job: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImpvYkdyYWQiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2E4NTVmNztzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojN2MzYWVkO3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI2pvYkdyYWQpIi8+CjxwYXRoIGQ9Ik0yMDAgODBDMTc1IDgwIDE1NSAxMDAgMTU1IDEyNUwxNTUgMTgwQzE1NSAxODUgMTYwIDE5MCAxNjUgMTkwTDIzNSAxOTBDMjQwIDE5MCAyNDUgMTg1IDI0NSAxODBMMjQ1IDEyNUMyNDUgMTAwIDIyNSA4MCAyMDAgODBaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPHBhdGggZD0iTTE3MCAxMjBMMTcwIDEwNUMxNzAgOTUgMTc4IDg3IDE4OCA4N0wyMTIgODdDMjIyIDg3IDIzMCA5NSAyMzAgMTA1TDIzMCAxMjAiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8dGV4dCB4PSI1MCUiIHk9IjcwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgwIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfkrw8L3RleHQ+Cjwvc3ZnPg==',
      service: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InNlcnZpY2VHcmFkIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmOTdiMTY7c3RvcC1vcGFjaXR5OjEiIC8+CjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I2VhNTgwYztzdG9wLW9wYWNpdHk6MSIgLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNzZXJ2aWNlR3JhZCkiLz4KPHBhdGggZD0iTTE4MCA5MEwxODAgMTgwTDE2MCAxODBDMTUwIDE4MCAxNDAgMTcwIDE0MCAxNjBMMTQwIDExMEMxNDAgMTAwIDE1MCA5MCAxNjAgOTBMMTgwIDkwWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4zIi8+CjxjaXJjbGUgY3g9IjE3MCIgY3k9IjEwMCIgcj0iMTAiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8cGF0aCBkPSJNMjIwIDkwTDI0MCAxMjBMMjIwIDE1MEwyMDAgMTIwTDIyMCA5MFoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8dGV4dCB4PSI1MCUiIHk9IjcwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgwIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfkqc8L3RleHQ+Cjwvc3ZnPg=='
    }
    return defaults[category] || null
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col md:flex-row" style={{ background: '#06402B' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:4s]"></div>

        {/* Floating particles - hidden on mobile */}
        <div className="absolute inset-0 hidden md:block">
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

      {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block relative z-10 w-64 bg-slate-900/90 backdrop-blur-sm border-r border-white/10">
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

          {/* Back Button and PWA Install */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-white/80 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
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
              onClick={() => router.push('/my-listings')}
              className="flex items-center w-full p-3 text-gray-300 rounded-lg hover:bg-purple-600/20 hover:text-white transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              My Listings
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
      <div className="relative z-10 flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-auto">
        {/* Header */}
        <div className="text-center mb-4 md:mb-8 relative">
          <div className="hidden md:block absolute top-0 right-0">
            <PWAInstallButton variant="compact" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Search MarketDZ</h1>
          <p className="text-sm md:text-lg text-white text-opacity-90 px-4">
            Find exactly what you're looking for in Algeria's premier marketplace
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-4 md:mb-8 shadow-xl">
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
        <div className="p-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {loading && pagination.totalItems === 0 ? 'Searching...' :
                 error ? 'Search Error' :
                 `Search Results`}
              </h2>
              {!loading && !error && (
                <p className="text-white/80 mt-1">
                  {pagination.totalItems === 0 ?
                    'No listings found' :
                    `${pagination.totalItems} ${pagination.totalItems === 1 ? 'listing' : 'listings'} found`}
                  {filters.query && ` for "${filters.query}"`}
                </p>
              )}
            </div>

            {/* Results Info */}
            {!loading && !error && pagination.totalItems > 0 && (
              <div className="text-sm text-white/70">
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

          {/* Results Grid - Responsive Mobile/Desktop Layout */}
          {!loading && !error && listings &&  (listings || []).length > 0 && (
            <>
              {/* Mobile Layout - 2 columns for 4 listings on screen - Only visible on screens < 768px */}
              <div className="md:hidden grid grid-cols-2 gap-3">
                {listings.map((listing) => (
                  <MobileListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => router.push(`/browse/${listing.id}`)}
                  />
                ))}
              </div>

              {/* Desktop Layout - Only visible on screens >= 768px */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {listings.map((listing) => {
                  const categoryBadge = getCategoryBadge(listing.category)

                  return (
                    <div
                      key={listing.id}
                      className="group bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 cursor-pointer shadow-lg hover:shadow-2xl"
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
                      {/* Enhanced Image Container */}
                      <div className="relative h-56 overflow-hidden">
                        {listing.photos && listing.photos.length > 0 ? (
                          <img
                            src={fixPhotoUrl(listing.photos[0])}
                            alt={listing.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgODBDMTA0LjQxOCA4MCAxMDggODMuNTgyIDEwOCA4OFYxMTJDMTA4IDExNi40MTggMTA0LjQxOCAxMjAgMTAwIDEyMEM5NS41ODIgMTIwIDkyIDExNi40MTggOTIgMTEyVjg4QzkyIDgzLjU4MiA5NS41ODIgODAgMTAwIDgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                            }}
                          />
                        ) : getDefaultImage(listing.category) ? (
                          <img
                            src={getDefaultImage(listing.category)!}
                            alt={listing.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        {/* Enhanced Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>

                        {/* Category Badge */}
                        <div className="absolute top-4 left-4">
                          <div className={`bg-gradient-to-r ${categoryBadge.color} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-lg backdrop-blur-sm`}>
                            <span className="mr-1">{categoryBadge.emoji}</span>
                            {categoryBadge.text}
                          </div>
                        </div>

                        {/* Enhanced Favorite Button */}
                        <div
                          data-favorite-button="true"
                          className="absolute top-4 right-4 z-10 pointer-events-auto"
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
                            className="backdrop-blur-sm shadow-lg"
                          />
                        </div>

                        {/* Enhanced Time Badge */}
                        <div className="absolute bottom-4 right-4">
                          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs shadow-lg">
                            {getTimeAgo(listing.created_at)}
                          </div>
                        </div>

                        {/* Location Badge */}
                        {(listing.city || listing.wilaya) && (
                          <div className="absolute bottom-4 left-4">
                            <div className="bg-white/10 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center">
                              📍 {listing.city ? `${listing.city}${listing.wilaya ? `, ${listing.wilaya}` : ''}` : listing.wilaya}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Content */}
                      <div className="p-6">
                        <h3 className="text-white font-bold text-xl mb-3 line-clamp-1 group-hover:text-purple-300 transition-colors">
                          {listing.title}
                        </h3>

                        <p className="text-white/70 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {listing.description}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                            {formatPrice(listing.price, listing.category)}
                          </div>

                          {listing.search_rank && listing.search_rank > 0 && (
                            <div className="flex items-center text-xs text-white/70">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Top Match
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        {listing.user && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (listing.user?.id) {
                                  router.push(`/profile/${listing.user.id}`)
                                }
                              }}
                              className="flex items-center text-sm text-white/70 hover:text-purple-300 transition-colors w-full text-left"
                            >
                              {listing.user.avatar_url ? (
                                <img
                                  src={listing.user.avatar_url}
                                  alt={`${listing.user.first_name} ${listing.user.last_name}`}
                                  className="w-8 h-8 rounded-full mr-2 border-2 border-white/20"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-white/10 mr-2 flex items-center justify-center border-2 border-white/20">
                                  <span className="text-xs text-white">
                                    {listing.user.first_name?.[0]}{listing.user.last_name?.[0]}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col flex-1">
                                <span className="text-white">By {listing.user.first_name} {listing.user.last_name}</span>
                                {listing.user.rating > 0 && (
                                  <div className="flex items-center mt-1">
                                    <StarRating rating={listing.user.rating} readonly size="sm" />
                                    <span className="text-xs text-white/50 ml-1">
                                      ({listing.user.rating.toFixed(1)})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </button>
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

      {/* Mobile Bottom Navigation is now global - see layout.tsx */}
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
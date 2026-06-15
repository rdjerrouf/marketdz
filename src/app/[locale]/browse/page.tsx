// src/app/[locale]/browse/page.tsx - Compatible with current API
'use client'

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { ALGERIA_WILAYAS, getLocalizedName } from '@/lib/constants/algeria'
import { getSubcategories } from '@/lib/constants/categories'
import { getSubcategoryConfig } from '@/lib/constants/subcategory-fields'
import type { FieldDef } from '@/lib/constants/subcategory-fields'
import FavoriteButton from '@/components/common/FavoriteButton'
import StarRating from '@/components/common/StarRating'
import MobileListingCard from '@/components/common/MobileListingCard'
import { fixPhotoUrl, getCategoryPlaceholder } from '@/lib/utils'

interface Listing {
  id: string
  title: string
  description: string
  price: number | null
  category: 'for_sale' | 'job' | 'service' | 'for_rent' | 'urgent'
  photos: string[]
  created_at: string
  status: string
  user_id: string
  wilaya?: string
  city?: string
  rental_period?: string | null
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
  subcategory: string
  wilaya: string
  city: string
  minPrice: string
  maxPrice: string
  sortBy: 'relevance' | 'newest' | 'oldest' | 'price_low' | 'price_high'
  vehicleMake: string
  vehicleTransmission: string
  vehicleFuelType: string
  vehicleYearMin: string
  vehicleYearMax: string
  vehicleMileageMax: string
  detailFilters: Record<string, string>
}

const VEHICLE_SUBCATS = new Set([
  'Vehicles', 'Motorcycles', 'Construction Vehicles & Trucks',
])

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
  const t = useTranslations('browse')
  const tNav = useTranslations('nav')
  const tForm = useTranslations('addItem')
  const locale = useLocale()
  const isRtl = locale === 'ar'

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
    subcategory: searchParams.get('subcategory') || '',
    wilaya: searchParams.get('wilaya') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: (searchParams.get('sortBy') as any) || 'relevance',
    vehicleMake: '',
    vehicleTransmission: '',
    vehicleFuelType: '',
    vehicleYearMin: '',
    vehicleYearMax: '',
    vehicleMileageMax: '',
    detailFilters: {}
  })

  const isVehicleSubcat = useMemo(() => VEHICLE_SUBCATS.has(filters.subcategory), [filters.subcategory])

  const subcatConfig = useMemo(
    () => getSubcategoryConfig(filters.category, filters.subcategory),
    [filters.category, filters.subcategory]
  )

  const jsonbEqualityFilters = useMemo<FieldDef[]>(
    () => subcatConfig?.fields.filter(f => f.searchable && !f.rangeFilter && f.storage === 'jsonb') ?? [],
    [subcatConfig]
  )

  // Memoized subcategories list based on selected category
  const availableSubcategories = useMemo(() => {
    if (!filters.category) return []
    return getSubcategories(filters.category as any)
  }, [filters.category])

  // Memoized cities list based on selected wilaya
  const availableCities = useMemo(() => {
    if (!filters.wilaya) return []
    const wilaya = ALGERIA_WILAYAS.find((w: any) => w.code === filters.wilaya || w.name === filters.wilaya)
    return wilaya ? wilaya.cities : []
  }, [filters.wilaya])



  // Reset subcategory when category changes
  useEffect(() => {
    if (filters.category && filters.subcategory && availableSubcategories.length > 0 && !availableSubcategories.some(s => s.name === filters.subcategory)) {
      setFilters(prev => ({ ...prev, subcategory: '' }))
    }
  }, [filters.category, filters.subcategory, availableSubcategories])

  // Reset city when wilaya changes
  useEffect(() => {
    if (filters.wilaya && filters.city && availableCities.length > 0 && !availableCities.some(c => c.name === filters.city)) {
      setFilters(prev => ({ ...prev, city: '' }))
    }
  }, [filters.wilaya, filters.city, availableCities])

  // Map sortBy values to API expected values
  const mapSortBy = (sortBy: string) => {
    const mapping: Record<string, string> = {
      'relevance': 'created_at',
      'newest': 'created_at',
      'oldest': 'oldest',
      'price_low': 'price_low',
      'price_high': 'price_high'
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
      if (filters.subcategory) queryParams.set('subcategory', filters.subcategory)
      if (filters.wilaya) queryParams.set('wilaya', filters.wilaya)
      if (filters.city) queryParams.set('city', filters.city)
      if (filters.minPrice && !isNaN(Number(filters.minPrice))) {
        queryParams.set('minPrice', filters.minPrice)
      }
      if (filters.maxPrice && !isNaN(Number(filters.maxPrice))) {
        queryParams.set('maxPrice', filters.maxPrice)
      }
      if (filters.vehicleMake) queryParams.set('vehicleMake', filters.vehicleMake)
      if (filters.vehicleTransmission) queryParams.set('vehicleTransmission', filters.vehicleTransmission)
      if (filters.vehicleFuelType) queryParams.set('vehicleFuelType', filters.vehicleFuelType)
      if (filters.vehicleYearMin && !isNaN(Number(filters.vehicleYearMin))) queryParams.set('vehicleYearMin', filters.vehicleYearMin)
      if (filters.vehicleYearMax && !isNaN(Number(filters.vehicleYearMax))) queryParams.set('vehicleYearMax', filters.vehicleYearMax)
      if (filters.vehicleMileageMax && !isNaN(Number(filters.vehicleMileageMax))) queryParams.set('vehicleMileageMax', filters.vehicleMileageMax)
      Object.entries(filters.detailFilters).forEach(([key, value]) => {
        if (value) queryParams.set(`d_${key}`, value)
      })
      queryParams.set('sortBy', mapSortBy(filters.sortBy))
      queryParams.set('page', page.toString())
      queryParams.set('limit', '20')
      queryParams.set('locale', locale)  // for zero-result search telemetry

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

  // Skip the search when no filter is set — avoids a DB hit on every cold /browse landing
  const hasActiveFilter = useMemo(() => {
    return Boolean(
      filters.query.trim() ||
      filters.category ||
      filters.subcategory ||
      filters.wilaya ||
      filters.city ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.vehicleMake ||
      filters.vehicleTransmission ||
      filters.vehicleFuelType ||
      filters.vehicleYearMin ||
      filters.vehicleYearMax ||
      filters.vehicleMileageMax ||
      Object.values(filters.detailFilters).some(Boolean)
    )
  }, [filters])

  useEffect(() => {
    if (hasActiveFilter) {
      performSearch(1)
    } else {
      setListings([])
      setPagination({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPreviousPage: false
      })
    }
  }, [performSearch, hasActiveFilter])

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
    if (key === 'subcategory') {
      setFilters(prev => ({
        ...prev,
        subcategory: value,
        vehicleMake: '',
        vehicleTransmission: '',
        vehicleFuelType: '',
        vehicleYearMin: '',
        vehicleYearMax: '',
        vehicleMileageMax: '',
        detailFilters: {}
      }))
    } else {
      setFilters(prev => ({ ...prev, [key]: value }))
    }
  }, [])

  const handleDetailFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      detailFilters: { ...prev.detailFilters, [key]: value }
    }))
  }, [])

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      subcategory: '',
      wilaya: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'relevance',
      vehicleMake: '',
      vehicleTransmission: '',
      vehicleFuelType: '',
      vehicleYearMin: '',
      vehicleYearMax: '',
      vehicleMileageMax: '',
      detailFilters: {}
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

  const formatPrice = (price: number | null, category: string, rentalPeriod?: string | null) => {
    if (!price) {
      if (category === 'job') return t('priceSalaryNegotiable')
      if (category === 'for_rent') return t('priceContactForPrice')
      if (category === 'urgent') return t('priceFree')
      return t('priceNegotiable')
    }

    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)

    // Add rental period for rental listings
    if (category === 'for_rent') {
      const periodMap: Record<string, string> = {
        'hourly': t('rentalHour'),
        'daily': t('rentalDay'),
        'weekly': t('rentalWeek'),
        'monthly': t('rentalMonth'),
        'yearly': t('rentalYear')
      }
      const periodText = rentalPeriod ? (periodMap[rentalPeriod] || t('rentalMonth')) : t('rentalMonth')
      return `${formattedPrice}${periodText}`
    }

    return formattedPrice
  }

  const getCategoryBadge = (category: string) => {
    const badges = {
      'for_sale': { text: t('categorySale'), color: 'bg-green-500', emoji: '💰' },
      'for_rent': { text: t('categoryRent'), color: 'bg-blue-500', emoji: '🏠' },
      'job': { text: t('categoryJob'), color: 'bg-red-500', emoji: '💼' },
      'service': { text: t('categoryService'), color: 'bg-purple-500', emoji: '🔧' }
    }
    return badges[category as keyof typeof badges] || { text: category, color: 'bg-gray-500', emoji: '📦' }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return t('timeJustNow')
    if (diffInHours < 24) return t('timeHoursAgo', { n: diffInHours })
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return t('timeDaysAgo', { n: diffInDays })
    return date.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col md:flex-row" style={{ background: '#F5F4F2' }}>
      {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
      <div className={`hidden md:block relative z-10 w-64 bg-white backdrop-blur-sm ${isRtl ? 'border-l' : 'border-r'} border-black/10`}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <img src="/icons/icon-192x192.png" alt="DlalaDZ" className="w-11 h-11 rounded-lg me-3" />
            <h1 className="text-gray-900 text-xl font-bold">DlalaDZ</h1>
          </div>

          {/* Back Button */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-800 hover:text-gray-900 transition-colors group"
            >
              <svg className={`w-5 h-5 me-2 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('back')}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            <button
              onClick={() => router.push('/')}
              className="flex items-center w-full p-3 text-gray-800 rounded-lg hover:bg-[#A16207]/20 hover:text-gray-900 transition-all duration-200"
            >
              <svg className="w-5 h-5 me-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {tNav('home')}
            </button>

            <div className="flex items-center w-full p-3 text-gray-900 bg-amber-100 rounded-lg border border-amber-300">
              <svg className="w-5 h-5 me-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('searchAndBrowse')}
            </div>

            <button
              onClick={() => router.push('/add-item')}
              className="flex items-center w-full p-3 text-gray-800 rounded-lg hover:bg-[#A16207]/20 hover:text-gray-900 transition-all duration-200"
            >
              <svg className="w-5 h-5 me-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('createListing')}
            </button>

            <button
              onClick={() => router.push('/my-listings')}
              className="flex items-center w-full p-3 text-gray-800 rounded-lg hover:bg-[#A16207]/20 hover:text-gray-900 transition-all duration-200"
            >
              <svg className="w-5 h-5 me-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {tNav('myListings')}
            </button>

            <button
              onClick={() => router.push('/favorites')}
              className="flex items-center w-full p-3 text-gray-800 rounded-lg hover:bg-[#A16207]/20 hover:text-gray-900 transition-all duration-200"
            >
              <svg className="w-5 h-5 me-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {tNav('favorites')}
            </button>

            <button
              onClick={() => router.push('/profile')}
              className="flex items-center w-full p-3 text-gray-800 rounded-lg hover:bg-[#A16207]/20 hover:text-gray-900 transition-all duration-200"
            >
              <svg className="w-5 h-5 me-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {tNav('profile')}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-auto">
        {/* Header */}
        <div className="text-center mb-4 md:mb-8 relative">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">{t('searchTitle')}</h1>
          <p className="text-sm md:text-lg text-gray-700 px-4">
            {t('searchSubtitle')}
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-4 md:mb-8 shadow-xl">
          <form onSubmit={(e) => { e.preventDefault(); performSearch(1); }}>
            {/* Search Query */}
            <div className="mb-6">
              <label htmlFor="search-query" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('filters.searchQuery')}
              </label>
              <input
                id="search-query"
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder={t('filters.searchPlaceholder')}
                dir={isRtl ? 'rtl' : 'ltr'}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
              {/* Category */}
              <div>
                <label htmlFor="category-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filters.category')}
                </label>
                <select
                  id="category-select"
                  value={filters.category}
                  onChange={(e) => { handleFilterChange('category', e.target.value); e.target.blur() }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">{t('allCategories')}</option>
                  <option value="for_sale">{t('categorySale')}</option>
                  <option value="for_rent">{t('categoryRent')}</option>
                  <option value="job">{t('categoryJob')}</option>
                  <option value="service">{t('categoryService')}</option>
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label htmlFor="subcategory-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filters.subcategory')}
                </label>
                <select
                  id="subcategory-select"
                  value={filters.subcategory}
                  onChange={(e) => { handleFilterChange('subcategory', e.target.value); e.target.blur() }}
                  disabled={!filters.category}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">
                    {filters.category ? t('filters.allSubcategories') : t('filters.selectCategoryFirst')}
                  </option>
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory.name} value={subcategory.name}>
                      {getLocalizedName(subcategory, locale)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wilaya */}
              <div>
                <label htmlFor="wilaya-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filters.wilaya')}
                </label>
                <select
                  id="wilaya-select"
                  value={filters.wilaya}
                  onChange={(e) => { handleFilterChange('wilaya', e.target.value); e.target.blur() }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">{t('filters.allWilayas')}</option>
                  {ALGERIA_WILAYAS.map((wilaya: any) => (
                    <option key={wilaya.code} value={wilaya.name}>
                      {getLocalizedName(wilaya, locale)}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label htmlFor="city-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filters.city')}
                </label>
                <select
                  id="city-select"
                  value={filters.city}
                  onChange={(e) => { handleFilterChange('city', e.target.value); e.target.blur() }}
                  disabled={!filters.wilaya}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">
                    {filters.wilaya ? t('filters.allCities') : t('filters.selectWilayaFirst')}
                  </option>
                  {availableCities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {getLocalizedName(city, locale)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label htmlFor="sort-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('sortBy')}
                </label>
                <select
                  id="sort-select"
                  value={filters.sortBy}
                  onChange={(e) => { handleFilterChange('sortBy', e.target.value as any); e.target.blur() }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="relevance">{t('sortRelevance')}</option>
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="oldest">{t('sortOldest')}</option>
                  <option value="price_low">{t('sortPriceAsc')}</option>
                  <option value="price_high">{t('sortPriceDesc')}</option>
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="min-price" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filters.minPrice')}
                </label>
                <input
                  id="min-price"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="0"
                  min="0"
                  dir="ltr"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="max-price" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filters.maxPrice')}
                </label>
                <input
                  id="max-price"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="∞"
                  min="0"
                  dir="ltr"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>
            </div>

            {/* Vehicle-specific filters */}
            {isVehicleSubcat && (
              <div className="border-t border-gray-200 pt-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('filters.vehicleFilters')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Make */}
                  <div>
                    <label htmlFor="vehicle-make" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('filters.vehicleMake')}
                    </label>
                    <input
                      id="vehicle-make"
                      type="text"
                      value={filters.vehicleMake}
                      onChange={(e) => handleFilterChange('vehicleMake', e.target.value)}
                      placeholder={t('filters.vehicleMakePlaceholder')}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    />
                  </div>

                  {/* Transmission */}
                  <div>
                    <label htmlFor="vehicle-transmission" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('filters.vehicleTransmission')}
                    </label>
                    <select
                      id="vehicle-transmission"
                      value={filters.vehicleTransmission}
                      onChange={(e) => { handleFilterChange('vehicleTransmission', e.target.value); e.target.blur() }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    >
                      <option value="">{t('filters.allTransmissions')}</option>
                      <option value="manual">{t('filters.manual')}</option>
                      <option value="automatic">{t('filters.automatic')}</option>
                      <option value="semi-automatic">{t('filters.semiAutomatic')}</option>
                    </select>
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label htmlFor="vehicle-fuel" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('filters.vehicleFuelType')}
                    </label>
                    <select
                      id="vehicle-fuel"
                      value={filters.vehicleFuelType}
                      onChange={(e) => { handleFilterChange('vehicleFuelType', e.target.value); e.target.blur() }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    >
                      <option value="">{t('filters.allFuelTypes')}</option>
                      <option value="petrol">{t('filters.petrol')}</option>
                      <option value="diesel">{t('filters.diesel')}</option>
                      <option value="electric">{t('filters.electric')}</option>
                      <option value="hybrid">{t('filters.hybrid')}</option>
                      <option value="lpg">{t('filters.lpg')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Year Min */}
                  <div>
                    <label htmlFor="vehicle-year-min" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('filters.vehicleYearMin')}
                    </label>
                    <input
                      id="vehicle-year-min"
                      type="number"
                      value={filters.vehicleYearMin}
                      onChange={(e) => handleFilterChange('vehicleYearMin', e.target.value)}
                      placeholder="1990"
                      min="1900"
                      max="2030"
                      dir="ltr"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    />
                  </div>

                  {/* Year Max */}
                  <div>
                    <label htmlFor="vehicle-year-max" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('filters.vehicleYearMax')}
                    </label>
                    <input
                      id="vehicle-year-max"
                      type="number"
                      value={filters.vehicleYearMax}
                      onChange={(e) => handleFilterChange('vehicleYearMax', e.target.value)}
                      placeholder="2025"
                      min="1900"
                      max="2030"
                      dir="ltr"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    />
                  </div>

                  {/* Max Mileage */}
                  <div>
                    <label htmlFor="vehicle-mileage-max" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('filters.vehicleMileageMax')}
                    </label>
                    <input
                      id="vehicle-mileage-max"
                      type="number"
                      value={filters.vehicleMileageMax}
                      onChange={(e) => handleFilterChange('vehicleMileageMax', e.target.value)}
                      placeholder="200000"
                      min="0"
                      dir="ltr"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic subcategory-specific JSONB filters */}
            {jsonbEqualityFilters.length > 0 && (
              <div className="border-t border-gray-200 pt-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('filters.detailFilters')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jsonbEqualityFilters.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {tForm(field.labelKey as Parameters<typeof tForm>[0])}
                      </label>
                      {field.options ? (
                        <select
                          value={filters.detailFilters[field.key] || ''}
                          onChange={(e) => { handleDetailFilterChange(field.key, e.target.value); e.target.blur() }}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        >
                          <option value="">
                            {field.selectPlaceholderKey
                              ? tForm(field.selectPlaceholderKey as Parameters<typeof tForm>[0])
                              : tForm(field.labelKey as Parameters<typeof tForm>[0])}
                          </option>
                          {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {tForm(opt.labelKey as Parameters<typeof tForm>[0])}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={filters.detailFilters[field.key] || ''}
                          onChange={(e) => handleDetailFilterChange(field.key, e.target.value)}
                          placeholder={field.placeholderKey
                            ? tForm(field.placeholderKey as Parameters<typeof tForm>[0])
                            : undefined}
                          dir={field.dir ?? 'auto'}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#A16207] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#854D0E] disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white me-2"></div>
                    {t('searching')}
                  </>
                ) : (
                  t('filters.apply')
                )}
              </button>

              <button
                type="button"
                onClick={clearFilters}
                disabled={loading}
                className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {t('filters.reset')}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div className="p-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {loading && pagination.totalItems === 0 ? t('searching') :
                 error ? t('searchError') :
                 t('searchResults')}
              </h2>
              {!loading && !error && (
                <p className="text-gray-700 mt-1">
                  {listings.length === 0 ?
                    t('noListings') :
                    pagination.totalItems ?
                      t('listingsFound', { count: pagination.totalItems }) :
                      `${listings.length}+ ${t('results')}`}
                  {filters.query && ` for "${filters.query}"`}
                </p>
              )}
            </div>

            {/* Results Info */}
            {!loading && !error && listings.length > 0 && pagination.totalItems > 0 && (
              <div className="text-sm text-gray-600">
                {t('showingRange', {
                  from: ((pagination.currentPage - 1) * 20) + 1,
                  to: Math.min(pagination.currentPage * 20, pagination.totalItems),
                  total: pagination.totalItems
                })}
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('searchFailed')}</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">{error}</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => performSearch(1)}
                  className="bg-[#A16207] text-white px-6 py-2 rounded-lg hover:bg-[#854D0E] transition-colors"
                >
                  {t('tryAgain')}
                </button>
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {t('filters.reset')}
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
          {!loading && !error && (!listings || (listings || []).length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {Object.values(filters).some(f => f) ? t('noResultsFound') : t('startYourSearch')}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {Object.values(filters).some(f => f)
                  ? t('adjustFiltersDesc')
                  : t('enterSearchDesc')
                }
              </p>
              {Object.values(filters).some(f => f) ? (
                <button
                  onClick={clearFilters}
                  className="bg-[#A16207] text-white px-6 py-2 rounded-lg hover:bg-[#854D0E] transition-colors"
                >
                  {t('clearAllFilters')}
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleFilterChange('query', '')
                    performSearch(1)
                  }}
                  className="bg-[#A16207] text-white px-6 py-2 rounded-lg hover:bg-[#854D0E] transition-colors"
                >
                  {t('browseAllListings')}
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
                      className="group bg-white backdrop-blur-sm rounded-3xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-500 hover:scale-105 cursor-pointer shadow-lg hover:shadow-2xl"
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
                        <img
                          src={listing.photos && listing.photos.length > 0 ? fixPhotoUrl(listing.photos[0]) : getCategoryPlaceholder(listing.category)}
                          alt={listing.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getCategoryPlaceholder(listing.category)
                          }}
                        />

                        {/* Enhanced Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>

                        {/* Category Badge */}
                        <div className="absolute top-4 start-4">
                          <div className={`bg-gradient-to-r ${categoryBadge.color} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-lg backdrop-blur-sm`}>
                            <span className="me-1">{categoryBadge.emoji}</span>
                            {categoryBadge.text}
                          </div>
                        </div>

                        {/* Enhanced Favorite Button */}
                        <div
                          data-favorite-button="true"
                          className="absolute top-4 end-4 z-10 pointer-events-auto"
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
                        <div className="absolute bottom-4 end-4">
                          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs shadow-lg">
                            {getTimeAgo(listing.created_at)}
                          </div>
                        </div>

                        {/* Location Badge */}
                        {(listing.city || listing.wilaya) && (
                          <div className="absolute bottom-4 start-4">
                            <div className="bg-white/10 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center">
                              📍 {listing.city ? `${listing.city}${listing.wilaya ? `, ${listing.wilaya}` : ''}` : listing.wilaya}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Content */}
                      <div className="p-6">
                        <h3 className="text-gray-900 font-bold text-xl mb-3 line-clamp-1 group-hover:text-purple-700 transition-colors">
                          {listing.title}
                        </h3>

                        <p className="text-gray-700 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {listing.description}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                            {formatPrice(listing.price, listing.category, listing.rental_period)}
                          </div>

                          {listing.search_rank && listing.search_rank > 0 && (
                            <div className="flex items-center text-xs text-gray-600">
                              <svg className="w-3 h-3 me-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {t('topMatch')}
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        {listing.user && (
                          <div className="mt-3 pt-3 border-t border-black/10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (listing.user?.id) {
                                  router.push(`/profile/${listing.user.id}`)
                                }
                              }}
                              className="flex items-center text-sm text-gray-700 hover:text-purple-700 transition-colors w-full text-left"
                            >
                              {listing.user.avatar_url ? (
                                <img
                                  src={listing.user.avatar_url}
                                  alt={`${listing.user.first_name} ${listing.user.last_name}`}
                                  className="w-8 h-8 rounded-full me-2 border-2 border-white/20"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-black/10 me-2 flex items-center justify-center border-2 border-black/20">
                                  <span className="text-xs text-gray-800">
                                    {listing.user.first_name?.[0]}{listing.user.last_name?.[0]}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col flex-1">
                                <span className="text-gray-900">By {listing.user.first_name} {listing.user.last_name}</span>
                                {listing.user.rating > 0 && (
                                  <div className="flex items-center mt-1">
                                    <StarRating rating={listing.user.rating} readonly size="sm" />
                                    <span className="text-xs text-gray-500 ms-1">
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
                    className="bg-[#A16207] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#854D0E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white me-2"></div>
                        {t('loadingMore')}
                      </>
                    ) : (
                      t('loadMoreRemaining', { count: pagination.totalItems - listings.length })
                    )}
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              <div className="text-center mt-6 text-sm text-gray-500">
                {pagination.totalPages > 1 && (
                  <span>{t('pageOf', { current: pagination.currentPage, total: pagination.totalPages })}</span>
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
    <Suspense fallback={<div className="min-h-screen bg-[#F5F4F2] flex items-center justify-center">Loading...</div>}>
      <BrowsePageContent />
    </Suspense>
  )
}
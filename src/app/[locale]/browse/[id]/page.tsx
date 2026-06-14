// src/app/[locale]/browse/[id]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase/client'
import { useUserRating } from '@/hooks/useReviews'
import StarRating from '@/components/common/StarRating'
import ContactSeller from '@/components/listings/ContactSeller'
import FavoriteButton from '@/components/common/FavoriteButton'
import { fixPhotoUrl } from '@/lib/utils'
interface Listing {
  id: string
  title: string
  description: string | null
  price: number | null
  category: 'for_sale' | 'job' | 'service' | 'for_rent' | 'urgent'
  subcategory: string | null
  photos: string[]
  created_at: string
  status: string
  user_id: string
  rental_period?: string | null
  location_wilaya: string | null
  location_city: string | null
  condition: string | null
  metadata: Record<string, unknown> | null
  // Vehicle dedicated columns
  vehicle_make: string | null
  vehicle_model: string | null
  vehicle_year: number | null
  vehicle_mileage: number | null
  vehicle_transmission: string | null
  vehicle_fuel_type: string | null
  vehicle_body_type: string | null
  // Generic subcategory details
  listing_details: Record<string, string | number | boolean | null> | null
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

export default function ListingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: listingId } = use(params)
  const t = useTranslations('listing')
  const tBrowse = useTranslations('browse')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [seller, setSeller] = useState<Seller | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Get seller's rating
  const { rating: sellerRating, reviewCount: sellerReviewCount, loading: ratingLoading } = useUserRating(listing?.user_id || '')

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
          .select(`
            id, title, description, price, category, subcategory, photos,
            created_at, status, user_id, rental_period, location_wilaya, location_city,
            condition, metadata,
            vehicle_make, vehicle_model, vehicle_year, vehicle_mileage,
            vehicle_transmission, vehicle_fuel_type, vehicle_body_type,
            listing_details
          `)
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
        setListing(listingData as Listing)

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

  const formatPrice = (price: number | null, category: string, rentalPeriod?: string | null) => {
    if (!price) {
      if (category === 'job') return tBrowse('priceSalaryNegotiable')
      if (category === 'service') return t('priceQuoteOnRequest')
      if (category === 'for_rent') return tBrowse('priceContactForPrice')
      if (category === 'urgent') return tBrowse('priceFree')
      return tBrowse('priceNegotiable')
    }

    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)

    if (category === 'for_rent' && rentalPeriod) {
      const periodMap: Record<string, string> = {
        'hourly': tBrowse('rentalHour'),
        'daily': tBrowse('rentalDay'),
        'weekly': tBrowse('rentalWeek'),
        'monthly': tBrowse('rentalMonth'),
        'yearly': tBrowse('rentalYear')
      }
      return `${formattedPrice}${periodMap[rentalPeriod] || ''}`
    }

    return formattedPrice
  }

  const getCategoryInfo = (category: string) => {
    const categories = {
      'for_sale': { text: tBrowse('categorySale'), color: 'bg-green-500', emoji: '💰' },
      'for_rent': { text: tBrowse('categoryRent'), color: 'bg-blue-500', emoji: '🏠' },
      'job': { text: tBrowse('categoryJob'), color: 'bg-red-500', emoji: '💼' },
      'service': { text: tBrowse('categoryService'), color: 'bg-purple-500', emoji: '🔧' },
      'urgent': { text: t('urgentHelp'), color: 'bg-red-500', emoji: '🚨' }
    }
    return categories[category as keyof typeof categories] || { text: category, color: 'bg-gray-500', emoji: '📦' }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return tBrowse('timeJustNow')
    if (diffInHours < 24) return tBrowse('timeHoursAgo', { n: diffInHours })
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return tBrowse('timeDaysAgo', { n: diffInDays })
    return date.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2DA85] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-[#F2DA85] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{error || t('notFound')}</h2>
          <p className="text-gray-600 mb-4">{t('notFoundDesc')}</p>
          <button
            onClick={() => router.push('/browse')}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            {t('browseAll')}
          </button>
        </div>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(listing.category)
  const isOwner = user?.id === listing.user_id

  return (
    <div className="min-h-screen bg-[#F2DA85]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <svg className={`w-5 h-5 me-2 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('backToListings')}
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

              {user && listing && (
                <FavoriteButton
                  listingId={listing.id}
                  listingOwnerId={listing.user_id}
                  size="md"
                  className="text-gray-600 hover:text-gray-900"
                />
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
                      src={fixPhotoUrl(listing.photos[currentImageIndex])}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Image Navigation */}
                  {listing.photos.length > 1 && (
                    <>
                      <button
                        onClick={isRtl ? nextImage : previousImage}
                        className="absolute start-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                        aria-label={t('prevImage')}
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button
                        onClick={isRtl ? previousImage : nextImage}
                        className="absolute end-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                        aria-label={t('nextImage')}
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Image Counter */}
                      <div className="absolute bottom-4 end-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {t('imageCounter', { current: currentImageIndex + 1, total: listing.photos.length })}
                      </div>
                    </>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-4 start-4">
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
                    <p>{t('noPhotos')}</p>
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
                          src={fixPhotoUrl(photo)}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('description')}</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            </div>

            {/* Vehicle Specifications */}
            {listing.category === 'for_sale' && (listing.vehicle_make || listing.vehicle_model || listing.vehicle_year || listing.vehicle_mileage || listing.vehicle_transmission || listing.vehicle_fuel_type) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('vehicleSpecs')}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {listing.vehicle_make && (
                    <div><span className="font-medium text-gray-600">{t('make')}:</span><p className="text-gray-900">{listing.vehicle_make}</p></div>
                  )}
                  {listing.vehicle_model && (
                    <div><span className="font-medium text-gray-600">{t('model')}:</span><p className="text-gray-900">{listing.vehicle_model}</p></div>
                  )}
                  {listing.vehicle_year && (
                    <div><span className="font-medium text-gray-600">{t('year')}:</span><p className="text-gray-900" dir="ltr">{listing.vehicle_year}</p></div>
                  )}
                  {listing.vehicle_mileage !== null && listing.vehicle_mileage !== undefined && (
                    <div><span className="font-medium text-gray-600">{t('mileage')}:</span><p className="text-gray-900" dir="ltr">{listing.vehicle_mileage.toLocaleString()} {t('kmUnit')}</p></div>
                  )}
                  {listing.vehicle_transmission && (
                    <div><span className="font-medium text-gray-600">{t('transmission')}:</span>
                      <p className="text-gray-900">{
                        listing.vehicle_transmission === 'manual' ? t('manual') :
                        listing.vehicle_transmission === 'automatic' ? t('automatic') : t('semiAutomatic')
                      }</p>
                    </div>
                  )}
                  {listing.vehicle_fuel_type && (
                    <div><span className="font-medium text-gray-600">{t('fuelType')}:</span>
                      <p className="text-gray-900">{
                        listing.vehicle_fuel_type === 'petrol' ? t('petrol') :
                        listing.vehicle_fuel_type === 'diesel' ? t('diesel') :
                        listing.vehicle_fuel_type === 'electric' ? t('electric') :
                        listing.vehicle_fuel_type === 'hybrid' ? t('hybrid') : t('lpg')
                      }</p>
                    </div>
                  )}
                  {listing.vehicle_body_type && (
                    <div><span className="font-medium text-gray-600">{t('bodyType')}:</span><p className="text-gray-900 capitalize">{listing.vehicle_body_type}</p></div>
                  )}
                </div>
              </div>
            )}

            {/* Generic Subcategory Specifications */}
            {listing.listing_details && Object.keys(listing.listing_details).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('specsSection')}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Real Estate */}
                  {listing.listing_details.property_type && (
                    <div><span className="font-medium text-gray-600">{t('propertyType')}:</span><p className="text-gray-900 capitalize">{listing.listing_details.property_type as string}</p></div>
                  )}
                  {listing.listing_details.bedrooms != null && (
                    <div><span className="font-medium text-gray-600">{t('bedrooms')}:</span><p className="text-gray-900" dir="ltr">{listing.listing_details.bedrooms as number}</p></div>
                  )}
                  {listing.listing_details.bathrooms != null && (
                    <div><span className="font-medium text-gray-600">{t('bathrooms')}:</span><p className="text-gray-900" dir="ltr">{listing.listing_details.bathrooms as number}</p></div>
                  )}
                  {listing.listing_details.size_sqm != null && (
                    <div><span className="font-medium text-gray-600">{t('sizeSqm')}:</span><p className="text-gray-900" dir="ltr">{listing.listing_details.size_sqm as number} {t('sqmUnit')}</p></div>
                  )}
                  {listing.listing_details.floor != null && (
                    <div><span className="font-medium text-gray-600">{t('floor')}:</span><p className="text-gray-900" dir="ltr">{listing.listing_details.floor as number}</p></div>
                  )}
                  {listing.listing_details.furnished && (
                    <div><span className="font-medium text-gray-600">{t('furnished')}:</span><p className="text-gray-900 capitalize">{listing.listing_details.furnished as string}</p></div>
                  )}
                  {/* Electronics / Fashion / Home */}
                  {listing.listing_details.brand && (
                    <div><span className="font-medium text-gray-600">{t('brand')}:</span><p className="text-gray-900">{listing.listing_details.brand as string}</p></div>
                  )}
                  {listing.listing_details.model_name && (
                    <div><span className="font-medium text-gray-600">{t('model')}:</span><p className="text-gray-900">{listing.listing_details.model_name as string}</p></div>
                  )}
                  {listing.listing_details.storage && (
                    <div><span className="font-medium text-gray-600">{t('storage')}:</span><p className="text-gray-900" dir="ltr">{listing.listing_details.storage as string}</p></div>
                  )}
                  {listing.listing_details.storage_gb && (
                    <div><span className="font-medium text-gray-600">{t('storage')}:</span><p className="text-gray-900" dir="ltr">{listing.listing_details.storage_gb as string}</p></div>
                  )}
                  {listing.listing_details.ram_gb && (
                    <div><span className="font-medium text-gray-600">{t('ram')}:</span><p className="text-gray-900" dir="ltr">{listing.listing_details.ram_gb as string}</p></div>
                  )}
                  {listing.listing_details.processor && (
                    <div><span className="font-medium text-gray-600">{t('processor')}:</span><p className="text-gray-900">{listing.listing_details.processor as string}</p></div>
                  )}
                  {listing.listing_details.size && (
                    <div><span className="font-medium text-gray-600">{t('size')}:</span><p className="text-gray-900">{listing.listing_details.size as string}</p></div>
                  )}
                  {listing.listing_details.color && (
                    <div><span className="font-medium text-gray-600">{t('color')}:</span><p className="text-gray-900">{listing.listing_details.color as string}</p></div>
                  )}
                  {listing.listing_details.material && (
                    <div><span className="font-medium text-gray-600">{t('material')}:</span><p className="text-gray-900">{listing.listing_details.material as string}</p></div>
                  )}
                  {listing.listing_details.dimensions && (
                    <div><span className="font-medium text-gray-600">{t('dimensions')}:</span><p className="text-gray-900" dir="ltr">{listing.listing_details.dimensions as string}</p></div>
                  )}
                  {/* Books */}
                  {listing.listing_details.author && (
                    <div><span className="font-medium text-gray-600">{t('author')}:</span><p className="text-gray-900">{listing.listing_details.author as string}</p></div>
                  )}
                  {listing.listing_details.book_language && (
                    <div><span className="font-medium text-gray-600">{t('language')}:</span><p className="text-gray-900 capitalize">{listing.listing_details.book_language as string}</p></div>
                  )}
                  {listing.listing_details.genre && (
                    <div><span className="font-medium text-gray-600">{t('genre')}:</span><p className="text-gray-900">{listing.listing_details.genre as string}</p></div>
                  )}
                  {/* Musical */}
                  {listing.listing_details.instrument_type && (
                    <div><span className="font-medium text-gray-600">{t('instrumentType')}:</span><p className="text-gray-900">{listing.listing_details.instrument_type as string}</p></div>
                  )}
                </div>
              </div>
            )}

            {/* Listing Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('details')}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">{t('category')}:</span>
                  <p className="text-gray-900">{categoryInfo.text}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{t('posted')}:</span>
                  <p className="text-gray-900">{getTimeAgo(listing.created_at)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{t('listingId')}:</span>
                  <p className="text-gray-900 font-mono" dir="ltr">{listing.id.slice(-8)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{t('status')}:</span>
                  <p className="text-gray-900 capitalize">{listing.status}</p>
                </div>
                {listing.location_wilaya && (
                  <div>
                    <span className="font-medium text-gray-600">{t('wilaya')}:</span>
                    <p className="text-gray-900">{listing.location_wilaya}</p>
                  </div>
                )}
                {listing.location_city && (
                  <div>
                    <span className="font-medium text-gray-600">{t('city')}:</span>
                    <p className="text-gray-900">{listing.location_city}</p>
                  </div>
                )}
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
                  {formatPrice(listing.price, listing.category, listing.rental_period)}
                </div>

                {/* Service Phone Display */}
                {listing.category === 'service' && !!listing.metadata?.service_phone && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div className="text-center">
                        <p className="text-sm text-blue-600 font-medium">{t('directContact')}</p>
                        <a
                          href={`tel:${listing.metadata.service_phone as string}`}
                          className="text-lg font-bold text-blue-800 hover:text-blue-900 transition-colors"
                        >
                          {listing.metadata.service_phone as string}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Application Contact Info */}
                {listing.category === 'job' && listing.metadata && (!!listing.metadata.application_email || !!listing.metadata.application_phone || !!listing.metadata.application_instructions) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                      <svg className="w-4 h-4 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                      </svg>
                      {t('howToApply')}
                    </h4>
                    <div className="space-y-2">
                      {!!listing.metadata.application_email && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a
                            href={`mailto:${listing.metadata.application_email as string}`}
                            className="text-green-700 hover:text-green-800 transition-colors"
                          >
                            {listing.metadata.application_email as string}
                          </a>
                        </div>
                      )}
                      {!!listing.metadata.application_phone && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <a
                            href={`tel:${listing.metadata.application_phone as string}`}
                            className="text-green-700 hover:text-green-800 transition-colors"
                          >
                            {listing.metadata.application_phone as string}
                          </a>
                        </div>
                      )}
                      {!!listing.metadata.application_instructions && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-sm text-green-700 font-medium mb-1">{t('applicationInstructions')}:</p>
                          <p className="text-sm text-green-800 whitespace-pre-wrap">
                            {listing.metadata.application_instructions as string}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isOwner && seller && (
                <ContactSeller
                  sellerId={seller.id}
                  sellerName={`${seller.first_name} ${seller.last_name}`}
                  listingId={listing.id}
                  listingTitle={listing.title}
                />
              )}

              {isOwner && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-green-800 font-medium">{t('yourListing')}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/edit-listing/${listing.id}`)}
                    className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    {t('editListing')}
                  </button>
                </div>
              )}
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('sellerInfo')}</h3>

              {seller ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center me-4 flex-shrink-0">
                        <span className="text-white font-semibold text-lg">
                          {seller.first_name?.[0] || 'U'}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => router.push(`/profile/${listing?.user_id}`)}
                          className="font-semibold text-gray-900 hover:text-purple-600 transition-colors text-start"
                        >
                          {seller.first_name} {seller.last_name}
                        </button>
                        <p className="text-sm text-gray-600">
                          {t('memberSince', { year: new Date(seller.created_at).getFullYear() })}
                        </p>

                        {/* Seller Rating */}
                        {!ratingLoading && (
                          <div className="flex items-center mt-1">
                            <StarRating rating={sellerRating} readonly size="sm" />
                            <span className="text-sm text-gray-600 ms-2">
                              {sellerRating > 0 ? (
                                <>({sellerRating.toFixed(1)} — {sellerReviewCount} {t('reviews')})</>
                              ) : (
                                `(${t('noReviews')})`
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating Actions */}
                  {user && user.id !== listing?.user_id && (
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/profile/${listing?.user_id}`)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        {t('viewProfileRate')}
                      </button>
                      <button
                        onClick={() => router.push(`/profile/${listing?.user_id}#reviews`)}
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        {t('viewReviews')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full me-4"></div>
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
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">{t('safetyTips')}</h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>• {t('safetyTip1')}</li>
                <li>• {t('safetyTip2')}</li>
                <li>• {t('safetyTip3')}</li>
                <li>• {t('safetyTip4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
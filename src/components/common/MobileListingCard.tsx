/**
 * MobileListingCard Component - 2-Column Mobile Grid Card
 *
 * DESIGN:
 * - Compact layout optimized for 2x2 mobile grid (grid-cols-2)
 * - 40% image height for visibility while scrolling
 * - Gradient overlays for text readability
 *
 * EVENT HANDLING:
 * - FavoriteButton integration with event propagation prevention
 * - Uses data-favorite-button attribute to detect favorite clicks
 * - Only navigates to detail page if clicking outside favorite button
 *
 * IMAGES:
 * - Lazy loading for performance
 * - Inline SVG placeholders for jobs/services (no 404s)
 * - fixPhotoUrl() for Docker URL compatibility
 */

'use client'

import { useRouter } from 'next/navigation'
import { Clock, MapPin, DollarSign, Home, User, Zap, AlertCircle } from 'lucide-react'
import FavoriteButton from './FavoriteButton'
import { fixPhotoUrl, getCategoryPlaceholder } from '@/lib/utils'

interface Listing {
  id: string
  title: string
  description: string | null
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

interface MobileListingCardProps {
  listing: Listing
  onClick?: () => void
}

export default function MobileListingCard({ listing, onClick }: MobileListingCardProps) {
  const router = useRouter()

  const formatPrice = (price: number | null, category: string, rentalPeriod?: string | null): string => {
    if (!price) {
      if (category === 'job') return 'Salary negotiable'
      if (category === 'for_rent') return 'Contact for price'
      if (category === 'urgent') return 'Free / Donation'
      return 'Price negotiable'
    }

    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)

    // Add rental period for rental listings
    if (category === 'for_rent' && rentalPeriod) {
      const periodMap: Record<string, string> = {
        'hourly': '/hour',
        'daily': '/day',
        'weekly': '/week',
        'monthly': '/month',
        'yearly': '/year'
      }
      const periodText = periodMap[rentalPeriod] || ''
      return `${formattedPrice}${periodText}`
    }

    return formattedPrice
  }

  const getCategoryConfig = (category: string) => {
    const configs = {
      'for_sale': {
        text: 'For Sale',
        color: 'from-emerald-400 to-emerald-600',
        bgColor: 'bg-emerald-500',
        icon: DollarSign
      },
      'for_rent': {
        text: 'For Rent',
        color: 'from-blue-400 to-blue-600',
        bgColor: 'bg-blue-500',
        icon: Home
      },
      'job': {
        text: 'Jobs',
        color: 'from-purple-400 to-purple-600',
        bgColor: 'bg-purple-500',
        icon: User
      },
      'service': {
        text: 'Services',
        color: 'from-orange-400 to-orange-600',
        bgColor: 'bg-orange-500',
        icon: Zap
      },
      'urgent': {
        text: 'URGENT',
        color: 'from-red-500 to-red-700',
        bgColor: 'bg-red-600',
        icon: AlertCircle
      }
    }
    return configs[category as keyof typeof configs] || {
      text: category,
      color: 'from-gray-400 to-gray-600',
      bgColor: 'bg-gray-500',
      icon: DollarSign
    }
  }

  const getTimeAgo = (dateString: string): string => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const categoryConfig = getCategoryConfig(listing.category)
  const CategoryIcon = categoryConfig.icon

  /**
   * Handle card click navigation
   * CRITICAL: Must check if favorite button was clicked
   * Why: Prevents navigating to detail page when toggling favorite
   */
  const handleClick = (e: React.MouseEvent) => {
    console.log('📦 MobileListingCard handleClick called');
    console.log('  - target:', (e.target as HTMLElement).tagName, (e.target as HTMLElement).className);
    console.log('  - currentTarget:', (e.currentTarget as HTMLElement).tagName);

    // Don't navigate if clicking on favorite button or its children
    const target = e.target as HTMLElement
    const closestFavoriteButton = target.closest('[data-favorite-button]')
    console.log('  - closest data-favorite-button:', closestFavoriteButton ? 'FOUND' : 'NOT FOUND');

    if (closestFavoriteButton) {
      console.log('🚫 Card click ignored - clicked on favorite button')
      return
    }

    console.log('📦 Navigating to listing detail page');
    if (onClick) {
      onClick()
    } else {
      router.push(`/browse/${listing.id}`)
    }
  }

  const isUrgent = listing.category === 'urgent'

  return (
    <div
      onClick={handleClick}
      className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 active:scale-95 cursor-pointer shadow-xl ${
        isUrgent
          ? 'border-2 border-red-500 hover:border-red-400 animate-pulse-slow shadow-red-500/50'
          : 'border border-white/10 hover:border-white/20'
      }`}
    >
      {/* Compact Image Container - Mobile Optimized for 2x2 Grid */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={listing.photos && listing.photos.length > 0 ? fixPhotoUrl(listing.photos[0]) : getCategoryPlaceholder(listing.category)}
          alt={listing.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getCategoryPlaceholder(listing.category)
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>

        {/* Category Badge - Top Left - Compact */}
        <div className="absolute top-2 left-2">
          <div className={`bg-gradient-to-r ${categoryConfig.color} text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center shadow-lg ${
            isUrgent ? 'animate-pulse' : ''
          }`}>
            <CategoryIcon className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">{categoryConfig.text}</span>
          </div>
        </div>

        {/* URGENT Badge Overlay - Center - Only for urgent listings */}
        {isUrgent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-red-600/95 text-white px-6 py-3 rounded-xl shadow-2xl transform rotate-[-5deg] animate-pulse">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-6 h-6" />
                <span className="text-2xl font-black tracking-wider">URGENT</span>
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Favorite Button - Top Right - Compact */}
        <div 
          className="absolute top-2 right-2 z-10"
          data-favorite-button="true"
          onClick={(e) => {
            console.log('❤️ Favorite wrapper clicked - stopping propagation');
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <FavoriteButton
            listingId={listing.id}
            listingOwnerId={listing.user_id}
            size="sm"
            className="backdrop-blur-sm shadow-lg"
          />
        </div>

        {/* Time Badge - Bottom Right - Compact */}
        <div className="absolute bottom-2 right-2">
          <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs flex items-center shadow-lg">
            <Clock className="w-3 h-3 mr-1" />
            <span className="text-[10px]">{getTimeAgo(listing.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Content Section - Compact for 2-Column Grid */}
      <div className="p-3">
        {/* Title - Compact */}
        <h3 className="text-white font-bold text-sm mb-2 line-clamp-2 leading-tight">
          {listing.title}
        </h3>

        {/* Price - Compact but Visible */}
        <div className="mb-2">
          <div className={`text-lg font-bold ${
            isUrgent
              ? 'bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent'
          }`}>
            {formatPrice(listing.price, listing.category, listing.rental_period)}
          </div>
        </div>

        {/* Location - Compact */}
        {(listing.city || listing.wilaya) && (
          <div className="flex items-center text-white/60 text-xs mb-2">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{listing.city || listing.wilaya}</span>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, Heart, Grid, TrendingUp, Clock, DollarSign, Eye, Star, Home, User, MessageCircle, Bell, Zap, Award, ChevronRight, ArrowRight, Sparkles, Trophy, Users, AlertCircle } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { fixPhotoUrl, getCategoryPlaceholder } from '@/lib/storage'
import ComingSoonModal from '@/components/premium/ComingSoonModal'
import MobileListingCard from '@/components/common/MobileListingCard'
import FavoriteButton from '@/components/common/FavoriteButton'
import BrowserGuidanceBanner from '@/components/BrowserGuidanceBanner'
import { detectBrowserInfo } from '@/lib/browser-detection'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  city: string | null;
  wilaya: string | null;
  rating: number | null;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: 'for_sale' | 'job' | 'service' | 'for_rent' | 'urgent';
  photos: string[];
  created_at: string;
  status: string;
  user_id: string;
  rental_period?: string | null;
  is_hot_deal?: boolean;
}


export default function CompleteKickAssHomepage() {
  const { user, loading } = useAuth()
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const tNav = useTranslations('nav')
  const tHome = useTranslations('home')
  const tCommon = useTranslations('common')
  const tBrowse = useTranslations('browse')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalListings: 0,
    hotDeals: 0,
    newToday: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState(new Set(['1', '3']))
  const [showComingSoonModal, setShowComingSoonModal] = useState(false)
  const [showNewTodayModal, setShowNewTodayModal] = useState(false)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [browserInfo, setBrowserInfo] = useState<ReturnType<typeof detectBrowserInfo> | null>(null)

  // Fetch user profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
          return
        }

        setProfile(data)
      } catch (err) {
        console.error('Profile fetch error:', err)
      }
    }

    fetchProfile()
  }, [user])

  // Debug authentication state
  useEffect(() => {
    console.log('🏠 HomePage Authentication State:', {
      user: user ? { id: user.id, email: user.email } : null,
      profile: profile ? { first_name: profile.first_name, last_name: profile.last_name } : null,
      loading,
      timestamp: new Date().toISOString()
    })
  }, [user, profile, loading])

  // User counts now handled by individual pages/components as needed

  // Detect browser and show install button if appropriate
  useEffect(() => {
    const info = detectBrowserInfo()
    setBrowserInfo(info)

    // Show install button if:
    // 1. Not already installed
    // 2. On iOS Safari OR Android Chrome
    const shouldShowInstall = !info.isInstalled && info.isOptimalBrowser
    setShowInstallButton(shouldShowInstall)
  }, [])

  const handleInstallClick = () => {
    if (!browserInfo) return

    if (browserInfo.isInstalled) {
      alert('✅ DlalaDZ is already installed!')
      return
    }

    // Show install instructions
    alert(browserInfo.installInstructions)
  }

  // Fetch featured listings and stats
  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        setListingsLoading(true)

        // Use optimized search API instead of direct Supabase query
        // This uses proper indexes and server-side optimization for 250k+ listings
        const [listingsResponse, countResponse] = await Promise.all([
          fetch('/api/search?limit=9&sortBy=created_at', { cache: 'no-store' }),
          fetch('/api/search/count') // respects server Cache-Control (5 min) — no-store was hitting DB on every homepage load
        ])

        if (!listingsResponse.ok) {
          console.error('🏠 HomePage: Error fetching listings:', listingsResponse.status, listingsResponse.statusText)
          setFeaturedListings([])
        } else {
          const data = await listingsResponse.json()
          console.log('🏠 HomePage: Query successful!')
          console.log('🏠 HomePage: Fetched', data.listings?.length || 0, 'featured listings')
          console.log('🏠 HomePage: Listings data:', data.listings)
          setFeaturedListings(data.listings || [])
        }

        // Fetch total count separately (optimized count endpoint)
        if (countResponse.ok) {
          const countData = await countResponse.json()
          console.log('📊 HomePage: Count API Response:', countData)
          setStats({
            totalListings: countData.count || 0,
            hotDeals: 0, // Will be implemented with hot_deals feature
            newToday: 0 // Disabled - premium coming soon feature
          })
        } else {
          console.error('❌ HomePage: Count API Error:', countResponse.status, countResponse.statusText)
        }

        // Hot Deals and Fresh Arrivals are premium coming soon features

      } catch (err) {
        console.error('🏠 HomePage: Error:', err)
        setFeaturedListings([])
      } finally {
        setListingsLoading(false)
      }
    }

    fetchFeaturedListings()
  }, [])

  // PWA install functionality removed - handled by service worker

  const formatPrice = (price: number | null, category: string, rentalPeriod?: string | null): string => {
    if (!price) {
      if (category === 'job') return tBrowse('priceSalaryNegotiable')
      if (category === 'for_rent') return tBrowse('priceContactForPrice')
      if (category === 'urgent') return tBrowse('priceFree')
      return tBrowse('priceNegotiable')
    }

    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)

    if (category === 'for_rent') {
      const periodMap: Record<string, string> = {
        'hourly': tBrowse('rentalHour'),
        'daily': tBrowse('rentalDay'),
        'weekly': tBrowse('rentalWeek'),
        'monthly': tBrowse('rentalMonth'),
        'yearly': tBrowse('rentalYear')
      }
      const periodText = rentalPeriod ? (periodMap[rentalPeriod] || tBrowse('rentalMonth')) : tBrowse('rentalMonth')
      return `${formattedPrice}${periodText}`
    }

    return formattedPrice
  }

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { text: string; color: string; emoji: string; icon: React.ElementType }> = {
      'for_sale': { text: tHome('categories.forSale'), color: 'from-emerald-400 to-emerald-600', emoji: '💰', icon: DollarSign },
      'for_rent': { text: tHome('categories.forRent'), color: 'from-blue-400 to-blue-600', emoji: '🏠', icon: Home },
      'job': { text: tHome('categories.jobs'), color: 'from-purple-400 to-purple-600', emoji: '💼', icon: User },
      'service': { text: tHome('categories.services'), color: 'from-orange-400 to-orange-600', emoji: '🔧', icon: Zap },
      'urgent': { text: tHome('categories.urgent'), color: 'from-red-500 to-red-700', emoji: '🚨', icon: AlertCircle }
    }
    return badges[category] || { text: category, color: 'from-gray-400 to-gray-600', emoji: '📦', icon: Grid }
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

  // Note: toggleFavorite is kept for future functionality
  // Currently using FavoriteButton component which handles favorites internally
  const toggleFavorite = (id: string): void => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
      } else {
        newFavorites.add(id)
      }
      return newFavorites
    })
  }
  // Suppress unused variable warning - will be used when integrating favorite sync
  void toggleFavorite

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Redirect to browse page with search query
      window.location.href = `/browse?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSignOut = async () => {
    try {
      console.log('🔓 Home: Starting sign out process')
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('🔓 Home: Supabase sign out error:', error)
      } else {
        console.log('🔓 Home: Supabase sign out successful')
      }
      
      console.log('🔓 Home: Sign out complete')
      
      // Reload the page to reflect signed out state
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
      // Still reload the page to reflect signed out state
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#06402B' }}>
      {/* Animated background elements with enhanced effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
            { left: 'left-[80%]', top: 'top-[25%]', opacity: 'opacity-50' },
            { left: 'left-[15%]', top: 'top-[60%]', opacity: 'opacity-20' },
            { left: 'left-[35%]', top: 'top-[75%]', opacity: 'opacity-30' },
            { left: 'left-[55%]', top: 'top-[50%]', opacity: 'opacity-10' },
            { left: 'left-[75%]', top: 'top-[70%]', opacity: 'opacity-40' },
            { left: 'left-[90%]', top: 'top-[45%]', opacity: 'opacity-20' },
            { left: 'left-[5%]', top: 'top-[80%]', opacity: 'opacity-30' },
            { left: 'left-[45%]', top: 'top-[5%]', opacity: 'opacity-50' },
            { left: 'left-[65%]', top: 'top-[85%]', opacity: 'opacity-10' },
            { left: 'left-[85%]', top: 'top-[35%]', opacity: 'opacity-40' },
            { left: 'left-[30%]', top: 'top-[90%]', opacity: 'opacity-20' },
            { left: 'left-[70%]', top: 'top-[40%]', opacity: 'opacity-30' },
            { left: 'left-[20%]', top: 'top-[65%]', opacity: 'opacity-50' },
            { left: 'left-[50%]', top: 'top-[95%]', opacity: 'opacity-10' },
            { left: 'left-[95%]', top: 'top-[15%]', opacity: 'opacity-40' },
            { left: 'left-[12%]', top: 'top-[40%]', opacity: 'opacity-20' }
          ].map((particle, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-white/10 rounded-full animate-pulse ${particle.left} ${particle.top} ${particle.opacity}`}
            />
          ))}
        </div>
      </div>

      {/* Mobile Navigation Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10 pointer-events-auto">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇩🇿</span>
            <h1 className="text-white text-xl font-bold">DlalaDZ</h1>
            {showInstallButton && (
              <button
                onClick={handleInstallClick}
                className="px-2 py-1 text-xs bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors whitespace-nowrap ml-1"
                title={browserInfo?.installInstructions}
              >
                Install
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact className="border border-white/10 rounded-lg px-1.5 py-1 bg-white/5" />
            {/* Profile Icon */}
            <Link href="/profile" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              {profile?.avatar_url ? (
                <img
                  src={fixPhotoUrl(profile.avatar_url)}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </Link>
          </div>
        </div>
        {/* Browser Guidance Banner - between header and content */}
        <BrowserGuidanceBanner />
      </div>

      {/* Enhanced Desktop Sidebar */}
      <div className={`hidden lg:flex w-52 fixed top-0 bottom-0 bg-black/20 backdrop-blur-xl pointer-events-auto ${isRtl ? 'right-0 border-l border-white/10' : 'left-0 border-r border-white/10'}`}>
        <div className="p-6 flex flex-col h-full">
          {/* Enhanced Logo */}
          <div className="flex items-center mb-12">
            <span className="text-6xl mr-4">🇩🇿</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">DlalaDZ</h1>
              <p className="text-white/60 text-sm">
                {tHome('hero.subtitle')}
              </p>
            </div>
          </div>

          <LanguageSwitcher compact className="mb-6 border border-white/10 rounded-xl px-2 py-1.5 bg-white/5" />

          {/* Enhanced Navigation Menu */}
          <nav className="space-y-3 flex-1">
            <Link href="/" className="flex items-center w-full p-4 text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 group shadow-lg">
              <Home className="w-5 h-5 me-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{tNav('home')}</span>
              <div className="ms-auto w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </Link>

            <Link href="/browse" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
              <Search className="w-5 h-5 me-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{tNav('browse')}</span>
              <ChevronRight className={`w-4 h-4 ms-auto opacity-0 group-hover:opacity-100 transition-all ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            </Link>

            {user ? (
              <Link href="/my-listings" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
                <Grid className="w-5 h-5 me-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{tNav('myListings')}</span>
              </Link>
            ) : null}

            <Link href="/add-item" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group relative overflow-hidden">
              <Plus className="w-5 h-5 me-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{tNav('post')}</span>
              <div className="ms-auto bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                {tCommon('new')}
              </div>
            </Link>

            <Link href="/favorites" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
              <Heart className="w-5 h-5 me-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{tNav('favorites')}</span>
            </Link>

            <Link href="/messages" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
              <MessageCircle className="w-5 h-5 me-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{tNav('messages')}</span>
              <div className="ms-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </Link>

            <Link href="/profile" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
              <User className="w-5 h-5 me-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{tNav('profile')}</span>
            </Link>
          </nav>

          {/* Desktop Authentication Buttons */}
          <div className="mt-4 space-y-3">
            {user ? (
              <>
                {/* Enhanced User Profile */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20 backdrop-blur-sm mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-white font-bold text-lg relative shadow-lg">
                      {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black/20 animate-pulse"></div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-white font-semibold text-sm">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="text-white/60 text-xs flex items-center">
                        <Trophy className="w-3 h-3 mr-1" />
                        {/* TODO: Add premium status field to database when implementing premium features */}
                        {profile?.rating && profile.rating > 4.0 ? 'Trusted Seller' : 'Member'}
                      </p>
                    </div>
                    <div className="relative">
                      <Bell className="w-5 h-5 text-white/60 hover:text-white transition-colors cursor-pointer" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 border border-red-500/20 group"
                >
                  <svg className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">{tNav('signOut')}</span>
                  <ChevronRight className={`w-4 h-4 ms-auto opacity-0 group-hover:opacity-100 transition-all ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </button>
              </>
            ) : (
              <>
                {/* Sign In Button */}
                <Link 
                  href="/signin" 
                  className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-green-500/10 hover:text-green-300 transition-all duration-300 border border-green-500/20 group"
                >
                  <svg className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">{tNav('signIn')}</span>
                  <ChevronRight className={`w-4 h-4 ms-auto opacity-0 group-hover:opacity-100 transition-all ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-300 border border-blue-500/20 group"
                >
                  <svg className="w-5 h-5 me-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="font-medium">{tNav('signUp')}</span>
                  <ChevronRight className={`w-4 h-4 ms-auto opacity-0 group-hover:opacity-100 transition-all ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`min-h-screen pointer-events-auto ${isRtl ? 'lg:mr-52' : 'lg:ml-52'}`}>
        <div className="p-8 pt-24 lg:pt-8 pb-32">
          {/* Search Bar Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative">
              <div className="flex bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
                <input
                  type="text"
                  placeholder={tHome('hero.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="flex-1 px-6 py-4 bg-transparent text-gray-800 placeholder-gray-500 outline-none text-lg"
                  dir={isRtl ? 'rtl' : 'ltr'}
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#7c3f00] hover:bg-[#5f2e00] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Search className="w-5 h-5 me-2" />
                  {tHome('hero.searchButton')}
                </button>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { label: tHome('quickFilters.electronics'), href: '/browse?category=for_sale' },
                  { label: tHome('quickFilters.realEstate'), href: '/browse?category=for_rent' },
                  { label: tHome('categories.jobs'), href: '/browse?category=job' },
                  { label: tHome('categories.services'), href: '/browse?category=service' },
                ].map((tag) => (
                  <Link
                    key={tag.label}
                    href={tag.href}
                    className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm hover:bg-white/20 transition-all duration-300 border border-white/20 hover:scale-105 hover:shadow-lg"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Link
              href="/browse"
              className="bg-gradient-to-br from-green-400/10 to-green-600/10 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-2xl block"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-green-400 to-green-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">
                    {stats.totalListings.toLocaleString()}
                  </div>
                  <div className="text-green-400 font-medium">{tHome('recentActivity.newListings')}</div>
                </div>
              </div>
              <div className="flex items-center text-green-300 text-sm">
                <ArrowRight className={`w-4 h-4 me-1 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                {tCommon('seeAll')}
              </div>
            </Link>

            <button
              onClick={() => setShowComingSoonModal(true)}
              className="bg-gradient-to-br from-orange-400/10 to-red-600/10 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-2xl w-full text-left cursor-pointer relative overflow-hidden"
            >
              {/* Coming Soon Badge */}
              <div className="absolute top-3 right-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold flex items-center shadow-lg">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Soon
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-orange-400 to-red-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform flex items-center justify-end">
                    {stats.hotDeals}
                    <div className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse shadow-lg">
                      HOT
                    </div>
                  </div>
                  <div className="text-orange-400 font-medium">{tHome('recentActivity.recentSales')}</div>
                </div>
              </div>
              <div className="flex items-center text-orange-300 text-sm">
                <ArrowRight className={`w-4 h-4 me-1 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                Premium Feature
              </div>
            </button>

            <button
              onClick={() => setShowNewTodayModal(true)}
              className="bg-gradient-to-br from-blue-400/10 to-purple-600/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group hover:scale-105 shadow-lg hover:shadow-2xl w-full text-left cursor-pointer relative overflow-hidden"
            >
              {/* Coming Soon Badge */}
              <div className="absolute top-3 right-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold flex items-center shadow-lg">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Soon
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-r from-blue-400 to-purple-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform flex items-center justify-end">
                    {stats.newToday}
                    <div className="ml-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-blue-400 font-medium">{tHome('recentActivity.newListings')}</div>
                </div>
              </div>
              <div className="flex items-center text-blue-300 text-sm">
                <ArrowRight className={`w-4 h-4 me-1 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                Premium Feature
              </div>
            </button>
          </div>

          {/* Enhanced Category Pills */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <Grid className="w-8 h-8 me-3 text-purple-400" />
              {tHome('categories.title')}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {['for_sale', 'for_rent', 'job', 'service'].map((category) => {
                const badge = getCategoryBadge(category)
                const Icon = badge.icon
                return (
                  <Link
                    key={category}
                    href={`/browse?category=${category}`}
                    className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl block"
                  >
                    <div className={`bg-gradient-to-r ${badge.color} p-4 rounded-xl mb-4 mx-auto w-fit group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-2xl`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{badge.text}</h3>
                    <p className="text-white/60 text-sm">
                      {category === 'for_sale' && tHome('quickFilters.electronics')}
                      {category === 'for_rent' && tHome('quickFilters.realEstate')}
                      {category === 'job' && tHome('categories.jobs')}
                      {category === 'service' && tHome('categories.services')}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Enhanced Featured Listings */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
                  <Star className="w-8 h-8 me-3 text-yellow-400" />
                  {tHome('featured.title')}
                </h2>
                <p className="text-white/60">
                  {listingsLoading ? tCommon('loading') :
                   featuredListings.length === 0 ? tCommon('noResults') :
                   tHome('featured.subtitle')}
                </p>
              </div>
              <Link href="/browse" className="flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors group">
                {tCommon('seeAll')}
                <ArrowRight className={`w-5 h-5 ms-2 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </Link>
            </div>

            {/* Loading State */}
            {listingsLoading && (
              <>
                {/* Mobile Loading - 2 columns */}
                <div className="md:hidden grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white/5 rounded-2xl overflow-hidden">
                      <div className="h-40 bg-white/10"></div>
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop Loading - 3 columns */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white/5 rounded-3xl overflow-hidden">
                      <div className="h-56 bg-white/10"></div>
                      <div className="p-6 space-y-3">
                        <div className="h-6 bg-white/10 rounded w-3/4"></div>
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {!listingsLoading && featuredListings.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white/5 rounded-3xl p-12 max-w-md mx-auto">
                  <Star className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">{tCommon('noResults')}</h3>
                  <p className="text-white/60 mb-6">{tHome('featured.subtitle')}</p>
                  <Link
                    href="/add-item"
                    className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 me-2" />
                    {tNav('post')}
                  </Link>
                </div>
              </div>
            )}

            {/* Mobile Layout - 2 columns for 4 listings on screen - Only visible on screens < 768px or PWA standalone */}
            {!listingsLoading && featuredListings.length > 0 && (
              <div className="md:hidden grid grid-cols-2 gap-3">
                {featuredListings.map((listing) => (
                  <MobileListingCard
                    key={listing.id}
                    listing={listing}
                  />
                ))}
              </div>
            )}

            {/* Desktop Layout - Only visible on screens >= 768px */}
            {!listingsLoading && featuredListings.length > 0 && (
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredListings.map((listing, index) => {
                const badge = getCategoryBadge(listing.category)
                const isFavorite = favorites.has(listing.id)
                const isUrgent = listing.category === 'urgent'

                return (
                  <Link
                    href={`/browse/${listing.id}`}
                    key={listing.id}
                    className={`group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl overflow-hidden transition-all duration-500 hover:scale-105 cursor-pointer shadow-lg hover:shadow-2xl block ${
                      isUrgent
                        ? 'border-2 border-red-500 hover:border-red-400 animate-pulse-slow shadow-red-500/50'
                        : 'border border-white/10 hover:border-white/30'
                    }`}
                  >
                    {/* Enhanced Image Container */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={listing.photos && listing.photos.length > 0 ? fixPhotoUrl(listing.photos[0]) : getCategoryPlaceholder(listing.category)}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = getCategoryPlaceholder(listing.category) }}
                      />

                      {/* Enhanced Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <div className={`bg-gradient-to-r ${badge.color} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-lg backdrop-blur-sm`}>
                          <span className="mr-1">{badge.emoji}</span>
                          {badge.text}
                        </div>
                      </div>

                      {/* Enhanced Favorite Button */}
                      <div
                        className="absolute top-4 right-4 z-10"
                        onClick={(e) => {
                          console.log('❤️ Home page desktop favorite wrapper clicked - stopping propagation');
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

                      {/* Enhanced Time Badge */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center shadow-lg">
                          <Clock className="w-3 h-3 mr-1" />
                          <span suppressHydrationWarning>{getTimeAgo(listing.created_at)}</span>
                        </div>
                      </div>

                      {/* Enhanced Featured Badge */}
                      {index < 2 && !isUrgent && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg animate-pulse">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            FEATURED
                          </div>
                        </div>
                      )}

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

                      {/* View Count Overlay */}
                      <div className="absolute bottom-4 left-4">
                        <div className="bg-white/10 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {100 + (parseInt(listing.id) * 47) % 400}
                        </div>
                      </div>
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
                        <div className={`text-2xl font-bold bg-gradient-to-r ${
                          isUrgent
                            ? 'from-red-400 to-red-600'
                            : 'from-green-400 to-green-600'
                        } bg-clip-text text-transparent`}>
                          {formatPrice(listing.price, listing.category, listing.rental_period)}
                        </div>
                        <div className="flex items-center text-white/50 text-sm">
                          <Users className="w-4 h-4 mr-1" />
                          {5 + (parseInt(listing.id) * 23) % 15} interested
                        </div>
                      </div>

                      {/* Enhanced Action Button (switched to #7c3f00) */}
                      <div className="w-full bg-[#7c3f00] hover:bg-[#5f2e00] text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg">
                        {tCommon('viewDetails')}
                        <ArrowRight className={`w-4 h-4 ms-2 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </Link>
                )
              })}
              </div>
            )}
          </div>

          {/* Enhanced Call to Action Section */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-3xl p-12 border border-purple-500/30 text-center mb-16 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-white mb-6">
                {tHome('hero.cta')}
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                {tHome('featured.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/add-item" className="bg-[#7c3f00] hover:bg-[#5f2e00] text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-xl hover:shadow-2xl">
                  <Plus className="w-6 h-6 me-3" />
                  {tNav('post')}
                </Link>
                <Link href="/help" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center justify-center shadow-lg hover:shadow-xl">
                  <Award className="w-6 h-6 me-3" />
                  {tCommon('seeAll')}
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Footer Section */}
          <div className="text-center py-12 border-t border-white/10 relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl mr-3 flex items-center justify-center">
                <span className="text-2xl">🇩🇿</span>
              </div>
              <h3 className="text-white text-lg font-semibold">DlalaDZ</h3>
            </div>
            <p className="text-white/60 mb-4">Algeria&apos;s premier marketplace connecting buyers and sellers nationwide</p>
            <div className="flex justify-center space-x-6 text-white/40 text-sm relative z-20">
              <span>© 2026 DlalaDZ</span>
              <span>•</span>
              <Link
                href="/privacy"
                className="hover:text-white hover:underline transition-colors cursor-pointer inline-block pointer-events-auto"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link
                href="/terms"
                className="hover:text-white hover:underline transition-colors cursor-pointer inline-block pointer-events-auto"
              >
                Terms of Service
              </Link>
              <span>•</span>
              <Link
                href="/help"
                className="hover:text-white hover:underline transition-colors cursor-pointer inline-block pointer-events-auto"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Modal for Hot Deals */}
      <ComingSoonModal
        isOpen={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        featureName="Hot Deals"
        featureIcon={<DollarSign className="w-12 h-12 text-white" />}
        benefits={[
          'Boost your listings to the top of search results',
          'Get 3x more visibility and views',
          'Special hot deal badges and highlights',
          'Priority placement in homepage carousel',
          'Sell faster with urgency indicators'
        ]}
      />

      {/* Coming Soon Modal for Fresh Arrivals */}
      <ComingSoonModal
        isOpen={showNewTodayModal}
        onClose={() => setShowNewTodayModal(false)}
        featureName="Fresh Arrivals"
        featureIcon={<Clock className="w-12 h-12 text-white" />}
        benefits={[
          'Get instant notifications for new listings',
          'Be the first to see fresh arrivals in your categories',
          'Set custom alerts for specific search criteria',
          'Never miss a great deal again',
          'Priority access to newly posted items'
        ]}
      />
    </div>
  )
}
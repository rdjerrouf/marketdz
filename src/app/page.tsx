'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Heart, Grid, TrendingUp, Clock, DollarSign, Eye, Star, Menu, X, Home, User, MessageCircle, Bell, Zap, Shield, Award, ChevronRight, ArrowRight, Sparkles, Trophy, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { fixPhotoUrl } from '@/lib/storage'
import ComingSoonModal from '@/components/premium/ComingSoonModal'
import MobileListingCard from '@/components/common/MobileListingCard'
import BrowserGuidanceBanner from '@/components/BrowserGuidanceBanner'

export default function CompleteKickAssHomepage() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [featuredListings, setFeaturedListings] = useState<any[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalListings: 0,
    hotDeals: 0,
    newToday: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [favorites, setFavorites] = useState(new Set(['1', '3']))
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [userListingsCount, setUserListingsCount] = useState(0)
  const [userFavoritesCount, setUserFavoritesCount] = useState(0)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [showComingSoonModal, setShowComingSoonModal] = useState(false)
  const [showNewTodayModal, setShowNewTodayModal] = useState(false)
  const [isPWA, setIsPWA] = useState(false)

  // Detect if running as PWA
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSPWA = (window.navigator as any).standalone === true
      setIsPWA(isStandalone || isIOSPWA)
    }
    checkPWA()
  }, [])

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

  // Fetch user's listings count
  useEffect(() => {
    const fetchUserListingsCount = async () => {
      if (!user) {
        setUserListingsCount(0)
        return
      }

      try {
        console.log('🏠 HomePage: Fetching listings count for user:', user.id)
        const { count, error } = await supabase
          .from('listings')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .neq('title', '') // Exclude invalid listings

        if (error) {
          console.error('🏠 HomePage: Error fetching listings count:', error)
          setUserListingsCount(0)
        } else {
          console.log('🏠 HomePage: User listings count:', count)
          setUserListingsCount(count || 0)
        }
      } catch (err) {
        console.error('🏠 HomePage: Error:', err)
        setUserListingsCount(0)
      }
    }

    fetchUserListingsCount()
  }, [user])

  // Fetch user's favorites count
  useEffect(() => {
    const fetchUserFavoritesCount = async () => {
      if (!user) {
        setUserFavoritesCount(0)
        return
      }

      try {
        console.log('🏠 HomePage: Fetching favorites count for user:', user.id)
        // Match the same query as the API to get accurate count
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            listing_id,
            listings!inner (
              id,
              status
            )
          `)
          .eq('user_id', user.id)
          .eq('listings.status', 'active')

        if (error) {
          console.error('🏠 HomePage: Error fetching favorites count:', error)
          setUserFavoritesCount(0)
        } else {
          const count = data?.length || 0
          console.log('🏠 HomePage: User favorites count (active listings only):', count)
          setUserFavoritesCount(count)
        }
      } catch (err) {
        console.error('🏠 HomePage: Error:', err)
        setUserFavoritesCount(0)
      }
    }

    fetchUserFavoritesCount()
  }, [user])

  // Fetch featured listings and stats
  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        setListingsLoading(true)

        // Fetch recent active listings with user info
        // Note: Using left join to include listings even if profile is missing
        const { data: listings, error } = await supabase
          .from('listings')
          .select(`
            *,
            user:profiles(
              id,
              first_name,
              last_name,
              avatar_url,
              rating
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(9)

        if (error) {
          console.error('🏠 HomePage: Error fetching listings:', error)
          console.error('🏠 HomePage: Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          setFeaturedListings([])
        } else {
          console.log('🏠 HomePage: Query successful!')
          console.log('🏠 HomePage: Fetched', listings?.length || 0, 'featured listings')
          console.log('🏠 HomePage: Listings data:', listings)
          setFeaturedListings(listings || [])
        }

        // Fetch total listings count
        const { count: totalCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        // Fetch listings created today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { count: todayCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('created_at', today.toISOString())

        setStats({
          totalListings: totalCount || 0,
          hotDeals: 0, // Will be implemented with hot_deals feature
          newToday: todayCount || 0
        })

      } catch (err) {
        console.error('🏠 HomePage: Error:', err)
        setFeaturedListings([])
      } finally {
        setListingsLoading(false)
      }
    }

    fetchFeaturedListings()
  }, [])

  // Auto-rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % 4)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // PWA Install functionality
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('📱 PWA: beforeinstallprompt event fired')
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show install button
      setShowInstallButton(true)
    }

    const handleAppInstalled = () => {
      console.log('📱 PWA: App was installed')
      // Hide install button
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 PWA: App is running in standalone mode')
      setShowInstallButton(false)
    } else {
      // Not installed - let beforeinstallprompt event control visibility
      // Only show button when browser indicates PWA is installable
      setShowInstallButton(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const formatPrice = (price: number | null, category: string): string => {
    if (!price) return category === 'job' ? 'Salary negotiable' : 'Price negotiable'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { text: string; color: string; emoji: string; icon: any }> = {
      'for_sale': { text: 'For Sale', color: 'from-emerald-400 to-emerald-600', emoji: '💰', icon: DollarSign },
      'for_rent': { text: 'For Rent', color: 'from-blue-400 to-blue-600', emoji: '🏠', icon: Home },
      'job': { text: 'Jobs', color: 'from-purple-400 to-purple-600', emoji: '💼', icon: User },
      'service': { text: 'Services', color: 'from-orange-400 to-orange-600', emoji: '🔧', icon: Zap }
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

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      console.log('📱 PWA: No deferred prompt available - using fallback')
      // Check if already installed
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        alert('📱 App is already installed!')
        return
      }
      // Show instructions for manual install
      alert('📱 To install:\n\n1. Tap the menu (⋮) in your browser\n2. Select "Add to Home screen" or "Install app"\n3. Enjoy the app!')
      return
    }

    console.log('📱 PWA: Showing install prompt')
    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`📱 PWA: User response to install prompt: ${outcome}`)

    if (outcome === 'accepted') {
      console.log('📱 PWA: User accepted the install prompt')
      setShowInstallButton(false)
    } else {
      console.log('📱 PWA: User dismissed the install prompt')
    }

    // Clear the deferredPrompt variable
    setDeferredPrompt(null)
  }

  const heroImages = [
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1200&h=800&fit=crop'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements with enhanced effects */}
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

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl mr-3 relative">
              <Shield className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-white text-xl font-bold">MarketDZ</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            title={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>
        {/* Browser Guidance Banner - between header and content */}
        <BrowserGuidanceBanner />
      </div>

      {/* Enhanced Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <div
            className={`fixed left-0 top-0 bottom-0 ${isPWA ? 'w-44' : 'w-80'} bg-black/30 backdrop-blur-xl border-r border-white/10 p-4`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center mb-8 mt-16">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl mr-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-white text-xl font-bold">MarketDZ</h1>
            </div>
            
            <nav className="space-y-3">
              <Link href="/" className="flex items-center w-full p-4 text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/20">
                <Home className="w-5 h-5 mr-4" />
                <span className="font-medium">Home</span>
                <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full"></div>
              </Link>
              
              <Link href="/browse" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300">
                <Search className="w-5 h-5 mr-4" />
                <span className="font-medium">Browse</span>
              </Link>

              {user ? (
                <Link href="/my-listings" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300">
                  <Grid className="w-5 h-5 mr-4" />
                  <span className="font-medium">My Listings</span>
                  {userListingsCount > 0 && (
                    <div className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {userListingsCount}
                    </div>
                  )}
                </Link>
              ) : null}
              
              <Link href="/add-item" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300">
                <Plus className="w-5 h-5 mr-4" />
                <span className="font-medium">Create Listing</span>
                <div className="ml-auto bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">NEW</div>
              </Link>
              
              <Link href="/favorites" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300">
                <Heart className="w-5 h-5 mr-4" />
                <span className="font-medium">Favorites</span>
                {userFavoritesCount > 0 && (
                  <div className="ml-auto bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                    {userFavoritesCount}
                  </div>
                )}
              </Link>

              <Link href="/messages" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300">
                <MessageCircle className="w-5 h-5 mr-4" />
                <span className="font-medium">Messages</span>
                <div className="ml-auto flex items-center">
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium mr-2">2</div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              </Link>

              <Link href="/profile" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300">
                <User className="w-5 h-5 mr-4" />
                <span className="font-medium">Profile</span>
              </Link>

              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                {user ? (
                  <>
                    {/* PWA Download Button - Mobile Signed-in */}
                    {showInstallButton && (
                      <button
                        className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10 hover:text-pink-300 transition-all duration-300 border border-pink-500/20"
                        onClick={handleInstallPWA}
                      >
                        <svg className="w-5 h-5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Install App</span>
                        {deferredPrompt && (
                          <div className="ml-auto bg-gradient-to-r from-pink-400 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                            READY
                          </div>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 border border-red-500/20"
                    >
                    <svg className="w-5 h-5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Sign Out</span>
                  </button>
                  </>
                ) : (
                  <>
                    <Link href="/signin" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-green-500/10 hover:text-green-300 transition-all duration-300 border border-green-500/20">
                      <svg className="w-5 h-5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Sign In</span>
                    </Link>
                    <Link href="/signup" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-300 border border-blue-500/20">
                      <svg className="w-5 h-5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span className="font-medium">Register</span>
                    </Link>
                    {/* PWA Download Button - Mobile */}
                    {showInstallButton && (
                      <button
                        className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10 hover:text-pink-300 transition-all duration-300 border border-pink-500/20"
                        onClick={handleInstallPWA}
                      >
                        <svg className="w-5 h-5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Install App</span>
                        {deferredPrompt && (
                          <div className="ml-auto bg-gradient-to-r from-pink-400 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                            READY
                          </div>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Enhanced Desktop Sidebar */}
      <div className="hidden lg:flex w-80 fixed left-0 top-0 bottom-0 bg-black/20 backdrop-blur-xl border-r border-white/10">
        <div className="p-8 flex flex-col h-full">
          {/* Enhanced Logo */}
          <div className="flex items-center mb-12">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl mr-4 relative">
              <Shield className="w-8 h-8 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-black/20"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse border border-black/20 [animation-delay:1s]"></div>
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">MarketDZ</h1>
              <p className="text-white/60 text-sm flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                Algeria's Premier
              </p>
            </div>
          </div>

          {/* Enhanced Navigation Menu */}
          <nav className="space-y-3 flex-1">
            <Link href="/" className="flex items-center w-full p-4 text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 group shadow-lg">
              <Home className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Home</span>
              <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </Link>

            <Link href="/browse" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
              <Search className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Browse</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            {user ? (
              <Link href="/my-listings" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
                <Grid className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">My Listings</span>
                {userListingsCount > 0 && (
                  <div className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse shadow-lg">
                    {userListingsCount}
                  </div>
                )}
              </Link>
            ) : null}

            <Link href="/add-item" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group relative overflow-hidden">
              <Plus className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Create Listing</span>
              <div className="ml-auto bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                NEW
              </div>
            </Link>

            <Link href="/favorites" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
              <Heart className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Favorites</span>
              {userFavoritesCount > 0 && (
                <div className="ml-auto bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  {userFavoritesCount}
                </div>
              )}
            </Link>

            <Link href="/messages" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
              <MessageCircle className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Messages</span>
              <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </Link>

            <Link href="/profile" className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300 group">
              <User className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Profile</span>
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
                {/* PWA Download Button for Signed-in Users */}
                {showInstallButton && (
                  <button
                    id="pwa-install-button-signed-in"
                    className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10 hover:text-pink-300 transition-all duration-300 border border-pink-500/20 group mb-3"
                    onClick={handleInstallPWA}
                  >
                    <svg className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Install App</span>
                    {deferredPrompt && (
                      <div className="ml-auto bg-gradient-to-r from-pink-400 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                        READY
                      </div>
                    )}
                  </button>
                )}
                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 border border-red-500/20 group"
                >
                  <svg className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Sign Out</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
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
                  <span className="font-medium">Sign In</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
                {/* Register Button */}
                <Link 
                  href="/signup" 
                  className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-300 border border-blue-500/20 group"
                >
                  <svg className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="font-medium">Register</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
                {/* PWA Download Button */}
                {showInstallButton && (
                  <button
                    id="pwa-install-button"
                    className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10 hover:text-pink-300 transition-all duration-300 border border-pink-500/20 group"
                    onClick={handleInstallPWA}
                  >
                    <svg className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Install App</span>
                    {deferredPrompt && (
                      <div className="ml-auto bg-gradient-to-r from-pink-400 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                        READY
                      </div>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-80 min-h-screen">
        <div className="p-8 pt-24 lg:pt-8">
          {/* Enhanced Hero Section */}
          <div className="relative mb-16 rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent z-10"></div>
            <div className="relative h-96 lg:h-80 overflow-hidden">
              {heroImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Hero ${idx + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                    idx === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                />
              ))}
            </div>
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 lg:px-12">
              <div className="max-w-2xl">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg animate-pulse">
                    <Zap className="w-4 h-4 mr-2" />
                    Algeria's #1 Marketplace
                  </div>
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Discover Amazing
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent animate-pulse"> Deals</span>
                </h1>
                <p className="text-xl text-white/90 mb-8 leading-relaxed">
                  From smartphones to apartments, jobs to services - find exactly what you're looking for in Algeria's most trusted marketplace.
                </p>
                
                {/* Enhanced Search Bar */}
                <div className="relative">
                  <div className="flex bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
                    <input
                      type="text"
                      placeholder="What are you looking for today?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="flex-1 px-6 py-4 bg-transparent text-gray-800 placeholder-gray-500 outline-none text-lg"
                    />
                    <button
                      onClick={handleSearch}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search
                    </button>
                  </div>
                  
                  {/* Enhanced Quick filters */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {['Electronics', 'Real Estate', 'Jobs', 'Services'].map((tag) => (
                      <button
                        key={tag}
                        className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm hover:bg-white/20 transition-all duration-300 border border-white/20 hover:scale-105 hover:shadow-lg"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hero navigation dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex space-x-2">
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                    title={`Slide ${idx + 1}`}
                  />
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
                  <div className="text-green-400 font-medium">Active Listings</div>
                </div>
              </div>
              <div className="flex items-center text-green-300 text-sm">
                <ArrowRight className="w-4 h-4 mr-1 group-hover:translate-x-1 transition-transform" />
                Browse all listings
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
                  <div className="text-orange-400 font-medium">Hot Deals</div>
                </div>
              </div>
              <div className="flex items-center text-orange-300 text-sm">
                <ArrowRight className="w-4 h-4 mr-1 group-hover:translate-x-1 transition-transform" />
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
                  <div className="text-blue-400 font-medium">New Today</div>
                </div>
              </div>
              <div className="flex items-center text-blue-300 text-sm">
                <ArrowRight className="w-4 h-4 mr-1 group-hover:translate-x-1 transition-transform" />
                Premium Feature
              </div>
            </button>
          </div>

          {/* Enhanced Category Pills */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <Grid className="w-8 h-8 mr-3 text-purple-400" />
              Browse by Category
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
                      {category === 'for_sale' && 'Electronics, furniture, cars & more'}
                      {category === 'for_rent' && 'Apartments, houses & commercial spaces'}
                      {category === 'job' && 'Full-time, part-time & remote positions'}
                      {category === 'service' && 'Professional services & expertise'}
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
                  <Star className="w-8 h-8 mr-3 text-yellow-400" />
                  Featured Listings
                </h2>
                <p className="text-white/60">
                  {listingsLoading ? 'Loading latest listings...' :
                   featuredListings.length === 0 ? 'No listings available yet' :
                   `${featuredListings.length} recent ${featuredListings.length === 1 ? 'listing' : 'listings'}`}
                </p>
              </div>
              <Link href="/browse" className="flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors group">
                View All
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
                  <h3 className="text-xl font-semibold text-white mb-2">No Listings Yet</h3>
                  <p className="text-white/60 mb-6">Be the first to create a listing!</p>
                  <Link
                    href="/add-item"
                    className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Listing
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

                return (
                  <Link
                    href={`/browse/${listing.id}`}
                    key={listing.id}
                    className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 cursor-pointer shadow-lg hover:shadow-2xl block"
                  >
                    {/* Enhanced Image Container */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={fixPhotoUrl(listing.photos[0])}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(listing.id)
                        }}
                        className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all duration-300 shadow-lg ${
                          isFavorite
                            ? 'bg-red-500 text-white scale-110 animate-pulse'
                            : 'bg-white/20 text-white hover:bg-white/30 hover:scale-110'
                        }`}
                        aria-label={isFavorite ? `Remove ${listing.title} from favorites` : `Add ${listing.title} to favorites`}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {/* Enhanced Time Badge */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center shadow-lg">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(listing.created_at)}
                        </div>
                      </div>

                      {/* Enhanced Featured Badge */}
                      {index < 2 && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg animate-pulse">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            FEATURED
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
                        <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                          {formatPrice(listing.price, listing.category)}
                        </div>
                        <div className="flex items-center text-white/50 text-sm">
                          <Users className="w-4 h-4 mr-1" />
                          {5 + (parseInt(listing.id) * 23) % 15} interested
                        </div>
                      </div>

                      {/* Enhanced Action Button */}
                      <div className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg hover:shadow-xl">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
              <Link href="/add-item" className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg hover:scale-110 transition-transform block cursor-pointer">
                <Plus className="w-12 h-12 text-white" />
              </Link>
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to Post Your Listing?
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Join thousands of users on MarketDZ. Post items for sale, rentals, jobs, or services in minutes and reach millions of people across Algeria.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/add-item" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-xl hover:shadow-2xl">
                  <Plus className="w-6 h-6 mr-3" />
                  Create Your Listing
                </Link>
                <Link href="/help" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center justify-center shadow-lg hover:shadow-xl">
                  <Award className="w-6 h-6 mr-3" />
                  Learn More
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Recent Activity */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <Clock className="w-8 h-8 mr-3 text-blue-400" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {[
                { icon: TrendingUp, color: 'from-green-400 to-green-600', text: '127 new listings added today', time: '2 minutes ago', count: '127' },
                { icon: DollarSign, color: 'from-yellow-400 to-orange-500', text: 'iPhone 13 Pro sold for 145,000 DA', time: '15 minutes ago', highlight: true },
                { icon: Users, color: 'from-blue-400 to-purple-600', text: '15 new members joined', time: '1 hour ago', count: '15' },
                { icon: Award, color: 'from-pink-400 to-red-500', text: 'Seller of the month: Ahmed B.', time: '3 hours ago', featured: true }
              ].map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-105">
                    <div className={`bg-gradient-to-r ${activity.color} p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.text}</p>
                      <p className="text-white/50 text-sm flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                    {activity.count && (
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm px-3 py-1 rounded-full font-bold">
                        +{activity.count}
                      </div>
                    )}
                    {activity.highlight && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                        SOLD
                      </div>
                    )}
                    {activity.featured && (
                      <div className="bg-gradient-to-r from-pink-400 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center">
                        <Trophy className="w-3 h-3 mr-1" />
                        WINNER
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Enhanced Footer Section */}
          <div className="text-center py-12 border-t border-white/10">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl mr-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold">MarketDZ</h3>
            </div>
            <p className="text-white/60 mb-4">Algeria's premier marketplace connecting buyers and sellers nationwide</p>
            <div className="flex justify-center space-x-6 text-white/40 text-sm">
              <span>© 2025 MarketDZ</span>
              <span>•</span>
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Support</span>
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
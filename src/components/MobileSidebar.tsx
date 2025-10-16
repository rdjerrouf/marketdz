'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu, X, Home, User, MessageCircle, Heart, Grid, 
  Plus, Search, Shield 
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface MobileSidebarProps {
  userListingsCount?: number
  userFavoritesCount?: number
  showInstallButton?: boolean
  onInstallPWA?: () => void
  deferredPrompt?: any
  isPWA?: boolean
}

export default function MobileSidebar({
  userListingsCount = 0,
  userFavoritesCount = 0,
  showInstallButton = false,
  onInstallPWA,
  deferredPrompt,
  isPWA = false
}: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  // Close sidebar when route changes
  useEffect(() => {
    console.log('🔄 Route changed to:', pathname)
    setIsOpen(false)
  }, [pathname])

  // Debug state changes
  useEffect(() => {
    console.log('🎯 SIDEBAR STATE:', isOpen ? 'OPEN' : 'CLOSED')
  }, [isOpen])

  // Handle outside clicks and body scroll lock
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Add event listeners for both mouse and touch
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside, { passive: true })
      
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      // Restore body scroll
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleSidebar = () => {
    console.log('🔥 SIDEBAR TOGGLE FIRED! Current state:', isOpen)
    setIsOpen(prev => {
      console.log('🎯 Setting sidebar to:', !prev)
      return !prev
    })
  }

  const handleButtonClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if this is a touch event
    if ('touches' in e || 'changedTouches' in e) {
      console.log('📱 TOUCH EVENT detected')
    } else {
      console.log('🖱️ MOUSE EVENT detected')
    }
    
    toggleSidebar()
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onPointerDown={handleButtonClick}
        className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 lg:hidden relative"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        title={isOpen ? "Close menu" : "Open menu"}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          zIndex: 9999,
          minWidth: '44px',
          minHeight: '44px',
          pointerEvents: 'auto',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
          style={{
            zIndex: 999,
            touchAction: 'none',
          }}
          onClick={() => setIsOpen(false)}
          onTouchEnd={(e) => {
            e.preventDefault()
            setIsOpen(false)
          }}
        />
      )}

      {/* Sidebar */}
      <nav
        ref={sidebarRef}
        className={`fixed top-0 left-0 bottom-0 bg-black/95 backdrop-blur-xl border-r border-white/10 lg:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: isPWA ? '176px' : '208px', // 44 = 11rem, 52 = 13rem
          zIndex: 1000,
          WebkitOverflowScrolling: 'touch',
          overflowY: 'auto',
        }}
      >
        <div className="p-4">
          {/* Close button at the top */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            aria-label="Close sidebar"
            style={{
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center mb-8 mt-16">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl mr-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white text-xl font-bold">MarketDZ</h1>
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/" 
              className="flex items-center w-full p-4 text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/20"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Home className="w-5 h-5 mr-4" />
              <span className="font-medium">Home</span>
              <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full"></div>
            </Link>
            
            <Link 
              href="/browse" 
              className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Search className="w-5 h-5 mr-4" />
              <span className="font-medium">Browse</span>
            </Link>

            {user && (
              <Link 
                href="/my-listings" 
                className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Grid className="w-5 h-5 mr-4" />
                <span className="font-medium">My Listings</span>
                {userListingsCount > 0 && (
                  <div className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {userListingsCount}
                  </div>
                )}
              </Link>
            )}
            
            <Link 
              href="/add-item" 
              className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Plus className="w-5 h-5 mr-4" />
              <span className="font-medium">Create Listing</span>
              <div className="ml-auto bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">NEW</div>
            </Link>
            
            <Link 
              href="/favorites" 
              className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Heart className="w-5 h-5 mr-4" />
              <span className="font-medium">Favorites</span>
              {userFavoritesCount > 0 && (
                <div className="ml-auto bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                  {userFavoritesCount}
                </div>
              )}
            </Link>

            <Link 
              href="/messages" 
              className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <MessageCircle className="w-5 h-5 mr-4" />
              <span className="font-medium">Messages</span>
              <div className="ml-auto flex items-center">
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium mr-2">2</div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </Link>

            <Link 
              href="/profile" 
              className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-white/5 hover:text-white transition-all duration-300"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
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
                      onClick={onInstallPWA}
                      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
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
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  >
                    <svg className="w-5 h-5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/signin" 
                    className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-green-500/10 hover:text-green-300 transition-all duration-300 border border-green-500/20"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <svg className="w-5 h-5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Sign In</span>
                  </Link>
                  <Link 
                    href="/signup" 
                    className="flex items-center w-full p-4 text-white/70 rounded-2xl hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-300 border border-blue-500/20"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <svg className="w-5 h-5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="font-medium">Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

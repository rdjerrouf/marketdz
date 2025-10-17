'use client'

import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

function MobileSidebarComponent({
  userListingsCount = 0,
  userFavoritesCount = 0,
  showInstallButton = false,
  onInstallPWA,
  deferredPrompt,
  isPWA = false
}: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  // Track client-side mount for portal
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debug: Component mounted
  useEffect(() => {
    console.log('🔵 [MobileSidebar] Component mounted', {
      pathname,
      isPWA,
      userListingsCount,
      userFavoritesCount,
      hasUser: !!user
    })
  }, [])

  // Close sidebar when route changes
  useEffect(() => {
    console.log('🔄 [MobileSidebar] Route changed, closing sidebar', { pathname })
    setIsOpen(false)
  }, [pathname])

  // Handle outside clicks and body scroll lock
  useEffect(() => {
    console.log('🎯 [MobileSidebar] isOpen state changed:', isOpen)

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as HTMLElement

      // Ignore if clicking the hamburger button itself
      if (buttonRef.current && buttonRef.current.contains(target)) {
        console.log('🚫 [MobileSidebar] Click on hamburger button itself, ignoring')
        return
      }

      console.log('👆 [MobileSidebar] Outside click/touch detected', {
        eventType: event.type,
        targetElement: target?.tagName,
        sidebarRefExists: !!sidebarRef.current,
        isHamburgerButton: buttonRef.current === target
      })

      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        console.log('✅ [MobileSidebar] Click was outside sidebar, closing')
        setIsOpen(false)
      } else {
        console.log('❌ [MobileSidebar] Click was inside sidebar, ignoring')
      }
    }

    if (isOpen) {
      console.log('🟢 [MobileSidebar] Sidebar is OPEN - Delaying outside-click listeners to avoid race condition')

      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'

      // CRITICAL FIX: Delay adding outside-click listeners to avoid catching the opening click
      const timeoutId = setTimeout(() => {
        console.log('⏰ [MobileSidebar] Now adding outside-click listeners (after delay)')
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside, { passive: true })
      }, 100) // 100ms delay to let the opening click event finish propagating

      return () => {
        console.log('🧹 [MobileSidebar] Cleanup - Removing event listeners and clearing timeout')
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
      }
    } else {
      console.log('🔴 [MobileSidebar] Sidebar is CLOSED - Restoring scroll')
      // Restore body scroll
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''

      return () => {
        console.log('🧹 [MobileSidebar] Cleanup (sidebar closed)')
      }
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

  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleSidebar = () => {
    console.log('🔄 [MobileSidebar] toggleSidebar called - Current state:', isOpen)
    setIsOpen(prev => {
      const newState = !prev
      console.log('🎯 [MobileSidebar] State changing from', prev, 'to', newState)
      return newState
    })
  }

  const handleButtonClick = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('🖱️ [MobileSidebar] Hamburger button clicked!', {
      eventType: e.type,
      currentIsOpen: isOpen,
      timestamp: new Date().toISOString(),
      target: (e.target as HTMLElement)?.tagName,
      currentTarget: (e.currentTarget as HTMLElement)?.tagName
    })
    e.preventDefault()
    e.stopPropagation()
    console.log('✋ [MobileSidebar] Event propagation stopped, calling toggleSidebar')
    toggleSidebar()
  }

  // Debug: Check button element properties on mount and state changes
  useEffect(() => {
    if (buttonRef.current) {
      const button = buttonRef.current
      const rect = button.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(button)

      console.log('🔍 [MobileSidebar] Button element debug info:', {
        visible: rect.width > 0 && rect.height > 0,
        position: {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        },
        computedStyles: {
          pointerEvents: computedStyle.pointerEvents,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          touchAction: computedStyle.touchAction
        },
        inlineStyles: button.style.cssText,
        isConnected: button.isConnected,
        disabled: button.disabled
      })

      // Check if anything is on top of the button
      const elementAtCenter = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      )
      console.log('🎯 [MobileSidebar] Element at button center:', {
        isButton: elementAtCenter === button,
        actualElement: elementAtCenter?.tagName,
        actualElementClass: elementAtCenter?.className,
        actualElementId: elementAtCenter?.id
      })
    }
  }, [isOpen])

  // Debug: Log render
  console.log('🎨 [MobileSidebar] Component rendering - Current state:', {
    isOpen,
    pathname,
    hasUser: !!user
  })

  return (
    <>
      {/* Hamburger Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          console.log('🖱️ [MobileSidebar] Button clicked (single onClick handler)', {
            type: e.type,
            currentIsOpen: isOpen,
            timestamp: new Date().toISOString()
          })
          handleButtonClick(e)
        }}
        className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 lg:hidden relative"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        title={isOpen ? "Close menu" : "Open menu"}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation', // Ensures immediate click response on touch devices
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

      {/* Render overlay and sidebar in a portal at document body level to escape parent positioning */}
      {isMounted && isOpen && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
            style={{
              zIndex: 999,
              touchAction: 'none',
            }}
            onClick={() => {
              console.log('🌫️ [MobileSidebar] Overlay clicked - closing sidebar')
              setIsOpen(false)
            }}
            onTouchEnd={(e) => {
              console.log('🌫️ [MobileSidebar] Overlay touch ended - closing sidebar')
              e.preventDefault()
              setIsOpen(false)
            }}
          />

          {/* Sidebar */}
          <nav
            ref={sidebarRef}
            className={`fixed top-0 left-0 bottom-0 bg-black/95 backdrop-blur-xl border-r border-white/10 lg:hidden transition-transform duration-300 ease-in-out translate-x-0`}
            style={{
              width: isPWA ? '176px' : '208px',
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
        </>,
        document.body
      )}
    </>
  )
}

//Memoize component to prevent unnecessary re-renders when parent page.tsx state changes
// Only re-render if props actually change (userListingsCount, userFavoritesCount, etc.)
const MobileSidebar = memo(MobileSidebarComponent, (prevProps, nextProps) => {
  // Custom comparison function - return true if props are equal (skip re-render)
  const propsEqual =
    prevProps.userListingsCount === nextProps.userListingsCount &&
    prevProps.userFavoritesCount === nextProps.userFavoritesCount &&
    prevProps.showInstallButton === nextProps.showInstallButton &&
    prevProps.isPWA === nextProps.isPWA &&
    prevProps.deferredPrompt === nextProps.deferredPrompt

  if (!propsEqual) {
    console.log('🔄 [MobileSidebar] Props changed, re-rendering:', {
      userListingsCount: {old: prevProps.userListingsCount, new: nextProps.userListingsCount},
      userFavoritesCount: {old: prevProps.userFavoritesCount, new: nextProps.userFavoritesCount},
      showInstallButton: {old: prevProps.showInstallButton, new: nextProps.showInstallButton},
      isPWA: {old: prevProps.isPWA, new: nextProps.isPWA}
    })
  }

  return propsEqual
})

MobileSidebar.displayName = 'MobileSidebar'

export default MobileSidebar

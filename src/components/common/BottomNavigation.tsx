'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Plus, Heart, MessageCircle, User } from 'lucide-react'

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  // Hide on desktop (≥768px)
  // Always visible on mobile
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      active: pathname === '/'
    },
    {
      icon: Search,
      label: 'Browse',
      path: '/browse',
      active: pathname.startsWith('/browse')
    },
    {
      icon: Plus,
      label: 'Post',
      path: '/add-item',
      active: pathname === '/add-item',
      highlight: true // Special styling for post button
    },
    {
      icon: Heart,
      label: 'Favorites',
      path: '/favorites',
      active: pathname.startsWith('/favorites')
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      path: '/messages',
      active: pathname.startsWith('/messages'),
      badge: 0 // TODO: Connect to real unread count
    },
    {
      icon: User,
      label: 'Profile',
      path: '/profile',
      active: pathname.startsWith('/profile')
    }
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isItemActive = item.active

          // Special styling for the "Post" button
          if (item.highlight) {
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center flex-1 py-2 relative"
                aria-label={item.label}
              >
                <div className={`${
                  isItemActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-purple-600'
                } rounded-full p-3 -mt-2 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className={`text-xs mt-1 ${
                  isItemActive ? 'text-purple-400 font-semibold' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors relative ${
                isItemActive ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
              aria-label={item.label}
              aria-current={isItemActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className="w-6 h-6"
                  strokeWidth={isItemActive ? 2.5 : 2}
                />
                {/* Badge for unread messages/notifications */}
                {item.badge && item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </div>
                )}
              </div>
              <span className={`text-xs mt-1 ${
                isItemActive ? 'font-semibold' : ''
              }`}>
                {item.label}
              </span>
              {/* Active indicator line */}
              {isItemActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-purple-400 rounded-b-full"></div>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

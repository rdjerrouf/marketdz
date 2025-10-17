'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Plus, Heart, MessageCircle, User } from 'lucide-react'

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  // TODO: Connect to real unread messages count
  const hasUnreadMessages = false

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
      active: pathname === '/add-item'
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
      hasUnread: hasUnreadMessages
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
          const hasUnread = 'hasUnread' in item ? item.hasUnread : false

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors relative ${
                isItemActive
                  ? 'text-purple-400'
                  : hasUnread
                  ? 'text-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              aria-label={item.label}
              aria-current={isItemActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 ${hasUnread && !isItemActive ? 'animate-pulse' : ''}`}
                  strokeWidth={isItemActive ? 2.5 : 2}
                />
                {/* Small dot indicator for unread messages */}
                {hasUnread && !isItemActive && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full"></div>
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

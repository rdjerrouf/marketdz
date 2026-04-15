/**
 * BottomNavigation Component - Mobile Bottom Tab Bar
 *
 * DESIGN:
 * - Mobile only: md:hidden (hidden on desktop)
 * - Fixed bottom position with safe-area-inset support (iOS notch)
 * - Dark theme: Slate-900 with backdrop blur
 *
 * FEATURES:
 * - Active tab highlighting (purple)
 * - Unread message indicator (green dot + pulse animation)
 * - 6 tabs: Home, Browse, Post, My Listings, Favorites, Messages
 */

'use client'

import { usePathname, useRouter } from '@/i18n/navigation'
import { Home, Search, Plus, Grid, MessageCircle, Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')

  // TODO: Connect to real unread messages count
  const hasUnreadMessages = false

  // next-intl usePathname returns locale-stripped paths, so these comparisons stay clean
  const navItems = [
    {
      icon: Home,
      label: t('home'),
      path: '/',
      active: pathname === '/'
    },
    {
      icon: Search,
      label: t('browse'),
      path: '/browse',
      active: pathname.startsWith('/browse')
    },
    {
      icon: Plus,
      label: t('post'),
      path: '/add-item',
      active: pathname === '/add-item'
    },
    {
      icon: Grid,
      label: t('myListings'),
      path: '/my-listings',
      active: pathname.startsWith('/my-listings')
    },
    {
      icon: Heart,
      label: t('favorites'),
      path: '/favorites',
      active: pathname.startsWith('/favorites')
    },
    {
      icon: MessageCircle,
      label: t('messages'),
      path: '/messages',
      active: pathname.startsWith('/messages'),
      hasUnread: hasUnreadMessages
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
                {hasUnread && !isItemActive && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </div>
              <span className={`text-xs mt-1 ${isItemActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isItemActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-400 rounded-b-full"></div>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

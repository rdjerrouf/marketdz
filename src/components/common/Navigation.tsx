// src/components/common/Navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Search, Plus, User, MessageCircle } from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtime';
import { NotificationBell } from '@/components/chat/NotificationsDropdown';
import NotificationsDropdown from '@/components/chat/NotificationsDropdown';

export default function Navigation() {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useRealtimeNotifications();

  // Hide Navigation on home page - it has its own MobileSidebar component
  if (pathname === '/') {
    return null;
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/browse', label: 'Browse', icon: Search },
    { href: '/search-advanced', label: 'Advanced Search', icon: Search },
    { href: '/add-item', label: 'Post', icon: Plus },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MarketDZ</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Notifications and user menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <NotificationBell
                onClick={() => setShowNotifications(!showNotifications)}
                unreadCount={unreadCount}
              />
              <NotificationsDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu removed - now handled by MobileSidebar component on each page */}
    </nav>
  );
}

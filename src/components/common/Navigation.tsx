/**
 * Navigation Component - Desktop Top Navigation Bar
 *
 * IMPORTANT:
 * - Desktop only: hidden on mobile (md:hidden CSS was a bug — fixed to hidden md:flex)
 * - Mobile uses BottomNavigation instead
 * - Hidden on homepage (homepage has custom hero)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Search, Plus, User, MessageCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useNotifications } from '@/contexts/NotificationsContext';
import { NotificationBell } from '@/components/chat/NotificationsDropdown';
import NotificationsDropdown from '@/components/chat/NotificationsDropdown';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Navigation() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  // Hide on homepage (has custom hero design)
  // next-intl usePathname returns locale-stripped path, so '/' works for all locales
  if (pathname === '/') {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/browse', label: t('browse'), icon: Search },
    { href: '/search-advanced', label: t('advancedSearch'), icon: Search },
    { href: '/add-item', label: t('post'), icon: Plus },
    { href: '/messages', label: t('messages'), icon: MessageCircle },
    { href: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <nav className="hidden md:block bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">DlalaDZ</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="flex items-baseline gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

          {/* Right side: notifications + language switcher */}
          <div className="flex items-center gap-3">
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
            <LanguageSwitcher className="bg-gray-800 rounded-lg px-1 py-0.5" />
          </div>
        </div>
      </div>
    </nav>
  );
}

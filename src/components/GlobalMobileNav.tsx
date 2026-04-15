'use client'

import { usePathname } from '@/i18n/navigation'
import MobileSidebar from './MobileSidebar'

export default function GlobalMobileNav() {
  // next-intl usePathname returns the locale-stripped path (e.g. '/' not '/ar/')
  const pathname = usePathname()

  // Hide on pages that have their own navigation system
  // - Homepage has its own MobileSidebar with special features
  // - Browse page has its own built-in mobile bottom navigation
  if (pathname === '/' || pathname === '/browse') {
    return null
  }

  // For all other pages, show basic mobile sidebar
  return (
    <MobileSidebar
      userListingsCount={0}
      userFavoritesCount={0}
      showInstallButton={false}
      onInstallPWA={() => {}}
      deferredPrompt={null}
      isPWA={false}
    />
  )
}

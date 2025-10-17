'use client'

import { usePathname } from 'next/navigation'
import MobileSidebar from './MobileSidebar'

export default function GlobalMobileNav() {
  const pathname = usePathname()

  // Only show on homepage - it has special props and PWA install button
  // Other pages will get a simpler version
  if (pathname === '/') {
    return null // Homepage has its own MobileSidebar with special features
  }

  // For all other pages, show basic mobile sidebar
  // No PWA install button or special features
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

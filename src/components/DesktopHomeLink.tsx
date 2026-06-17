'use client'

import { Link, usePathname } from '@/i18n/navigation'

// Desktop-only brand logo that links home. Fills the top-left space the
// back buttons used to occupy on top-level pages. Hidden on:
// - the home page (it has its own sidebar/logo)
// - drill-down pages (2+ path segments) which keep their own back button
// - auth + admin (their own navigation)
const HIDE_TOP_SEGMENTS = ['signin', 'signup', 'forgot-password', 'reset-password', 'admin']

export default function DesktopHomeLink() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Only show on single-segment top-level pages (e.g. /browse, /favorites)
  if (segments.length !== 1) return null
  if (HIDE_TOP_SEGMENTS.includes(segments[0])) return null

  return (
    <Link
      href="/"
      aria-label="DlalaDZ - Accueil"
      className="hidden md:flex fixed top-3 start-3 z-50 items-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm px-2.5 py-1.5 hover:bg-white hover:shadow-md transition-all"
    >
      <img src="/icons/icon-192x192.png" alt="DlalaDZ" className="w-8 h-8 rounded-lg" />
      <span className="text-gray-900 font-bold text-sm pe-1">DlalaDZ</span>
    </Link>
  )
}

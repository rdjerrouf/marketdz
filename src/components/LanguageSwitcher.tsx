'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  ar: 'العربية',
  fr: 'Français',
  en: 'English',
}

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(newLocale: string) {
    if (newLocale === locale) return
    // next-intl usePathname returns the locale-stripped path
    // We navigate to the same path under the new locale
    if (newLocale === routing.defaultLocale) {
      router.push(pathname)
    } else {
      router.push(`/${newLocale}${pathname}`)
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-xs text-white/40 hidden sm:inline">
        {/* globe icon */}
        <svg className="w-3.5 h-3.5 inline me-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      </span>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`text-xs px-2 py-1 rounded-md transition-all ${
            locale === loc
              ? 'bg-white/20 text-white font-semibold'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  )
}

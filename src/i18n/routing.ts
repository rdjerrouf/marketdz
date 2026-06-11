import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ar', 'fr', 'en'],
  defaultLocale: 'fr',
  // French is default: /browse → French, /ar/browse → Arabic, /en/browse → English
  localePrefix: 'as-needed',
  // Never auto-redirect based on browser Accept-Language — users pick the language manually
  localeDetection: false,
})

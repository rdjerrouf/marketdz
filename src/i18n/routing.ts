import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ar', 'fr', 'en'],
  defaultLocale: 'ar',
  // Arabic is default: /browse → Arabic, /fr/browse → French, /en/browse → English
  localePrefix: 'as-needed',
})

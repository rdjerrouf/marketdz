// src/config/app.ts
export const APP_CONFIG = {
  name: 'DlalaDZ',
  description: 'Algeria\'s Premier Online Marketplace',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000, // 30 seconds
  },

  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Storage Configuration
  storage: {
    buckets: {
      listings: 'listings',
      profiles: 'profiles',
      messages: 'messages',
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  },

  // Pagination
  pagination: {
    defaultLimit: 12,
    maxLimit: 100,
  },

  // Search Configuration
  search: {
    debounceMs: 300,
    minQueryLength: 2,
    maxSuggestions: 10,
  },

  // Notification Configuration
  notifications: {
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    defaultIcon: '/icons/icon-192x192.png',
  },

  // Rate Limiting
  rateLimit: {
    requests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Contact Information
  contact: {
    email: 'support@dlaladz.com',
    phone: '+213 XXX XXX XXX',
    address: 'Algiers, Algeria',
  },

  // Social Media
  social: {
    facebook: 'https://facebook.com/dlaladz',
    twitter: 'https://twitter.com/dlaladz',
    instagram: 'https://instagram.com/dlaladz',
    linkedin: 'https://linkedin.com/company/dlaladz',
  },

  // Feature Flags
  features: {
    enableReviews: true,
    enableChat: true,
    enableNotifications: true,
    enableAnalytics: true,
    enableAdmin: true,
    enablePWA: true,
  },

  // SEO Configuration
  seo: {
    defaultTitle: 'DlalaDZ - Algeria\'s Premier Online Marketplace',
    titleTemplate: '%s | DlalaDZ',
    defaultDescription: 'Buy and sell anything in Algeria. Cars, electronics, jobs, real estate and more on DlalaDZ.',
    defaultKeywords: ['marketplace', 'algeria', 'buy', 'sell', 'classified', 'ads'],
    defaultImage: '/images/og-image.jpg',
  },
} as const

export type AppConfig = typeof APP_CONFIG

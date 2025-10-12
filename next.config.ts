/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa');

import type { Configuration } from 'webpack';

const nextConfig = {
  output: 'standalone', // Enable for Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Exclude Supabase functions from build
  webpack: (config: Configuration) => {
    return config;
  },
  // External packages for server components
  serverExternalPackages: ['@supabase/supabase-js'],
  // Turbopack configuration
  turbopack: {
    // Remove ts-loader rule as Next.js handles TypeScript natively
  },
  // Disable source maps in development to prevent 404s
  productionBrowserSourceMaps: false,
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false, // PWA enabled for beta testing
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      // Admin API routes - never cache, always fetch from network
      urlPattern: /^https?:\/\/.*\/api\/admin\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      // Auth API routes - never cache
      urlPattern: /^https?:\/\/.*\/api\/auth\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      // Other API routes - network first with short cache
      urlPattern: /^https?:\/\/.*\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
    {
      // Static assets - cache first
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
});

export default withPWAConfig(nextConfig);
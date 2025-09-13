/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa');

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Exclude Supabase functions from build
  webpack: (config: any) => {
    return config;
  },
  // Exclude supabase functions directory from compilation
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
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
  disable: process.env.NODE_ENV === 'development', // Only enable in production/Docker
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
  ],
});

export default withPWAConfig(nextConfig);
/** @type {import('next').NextConfig} */
// Temporarily disabled PWA to prevent infinite reload loop
// import withPWA from 'next-pwa';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Turbopack configuration
  turbopack: {
    // Remove ts-loader rule as Next.js handles TypeScript natively
  },
  // Disable source maps in development to prevent 404s
  productionBrowserSourceMaps: false,
};

export default nextConfig;
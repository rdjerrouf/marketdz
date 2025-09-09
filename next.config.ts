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
  // Enable standalone output for Docker
  output: 'standalone',
  // Disable ESLint during builds for Docker
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build for Docker
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack configuration
  turbopack: {
    // Remove ts-loader rule as Next.js handles TypeScript natively
  },
  // Disable source maps in development to prevent 404s
  productionBrowserSourceMaps: false,
};

export default nextConfig;
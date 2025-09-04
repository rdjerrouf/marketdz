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
};

export default nextConfig;
# MarketDZ 🇩🇿

An Algerian marketplace application built with Next.js and Supabase.

## Features

- 🛍️ Browse marketplace listings (For Sale, Jobs, Services, Rentals)
- 🏠 Location-based filtering by Algerian Wilayas
- 🔍 Search and filter functionality
- 💰 Price range filtering
- 👤 User authentication
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **Deployment**: Vercel

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
MarketDZ - Algeria Marketplace PWA
Project Overview
MarketDZ is a comprehensive Progressive Web App (PWA) marketplace designed specifically for the Algerian market. It serves as a platform for users to buy and sell goods, find and post job opportunities, offer and discover services, and list rental properties.
Tech Stack:
• Frontend: Next.js 15 with React 19, TypeScript, Tailwind CSS
• Backend: Supabase (PostgreSQL database, authentication, real-time subscriptions, file storage)
• PWA: next-pwa with service worker caching
• Deployment: Vercel (recommended)
Project Structure
marketdz/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── (auth)/            # Route group for auth pages
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── browse/            # Browse listings
│   │   ├── chat/              # Real-time messaging
│   │   ├── profile/           # User profiles
│   │   ├── add-item/          # Create new listings
│   │   ├── api/               # API routes
│   │   ├── test-connection/   # Supabase connection test
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── auth/              # Authentication components
│   │   ├── listings/          # Listing-related components
│   │   ├── chat/              # Chat components
│   │   ├── navigation/        # Navigation components
│   │   └── common/            # Common components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Client-side Supabase config
│   │   │   └── server.ts      # Server-side Supabase config
│   │   ├── constants/
│   │   │   ├── algeria.ts     # Wilayas and cities
│   │   │   └── categories.ts  # Listing categories
│   │   ├── utils.ts           # Utility functions
│   │   └── validations.ts     # Form validation schemas
│   ├── hooks/                 # Custom React hooks
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── styles/                # Additional styles
├── public/
│   ├── icons/                 # PWA icons
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── .env.local                 # Environment variables (not in git)
├── next.config.ts             # Next.js configuration with PWA
├── package.json               # Dependencies and scripts
└── README.md                  # Project README
Environment Variables
Create .env.local in the root directory:
Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
Database Schema
Core Tables
1. profiles - User information (extends Supabase auth.users)
◦ Fields: id, first_name, last_name, bio, phone, avatar_url, city, wilaya, rating, review_count
◦ Relationships: One-to-many with listings, reviews, favorites
2. listings - All marketplace items (products, jobs, services, rentals)
◦ Fields: id, user_id, category, title, description, price, status, location, photos, metadata
◦ Categories: 'for_sale', 'job', 'service', 'for_rent'
◦ Statuses: 'active', 'sold', 'rented', 'completed', 'expired'
3. conversations - Chat conversations between users
◦ Fields: id, listing_id, buyer_id, seller_id, last_message_at
◦ Links buyers and sellers for specific listings
4. messages - Individual chat messages
◦ Fields: id, conversation_id, sender_id, content, message_type, read_at
◦ Real-time subscriptions enabled
5. reviews - User ratings and reviews
◦ Fields: id, reviewer_id, reviewed_id, listing_id, rating, comment
◦ Automatically updates user rating averages
6. favorites - Saved listings
◦ Fields: id, user_id, listing_id
◦ Many-to-many relationship between users and listings
7. blocked_users - User blocking for safety
◦ Fields: id, blocker_id, blocked_id
◦ Prevents interactions between users
Custom Types
CREATE TYPE listing_category AS ENUM ('for_sale', 'job', 'service', 'for_rent');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'rented', 'completed', 'expired');
CREATE TYPE message_type AS ENUM ('text', 'image', 'system');
Key Features
1.	User Authentication
• Sign up/sign in with email and password
• User profiles with Algeria-specific location data
• Password recovery functionality
• Profile editing and management
2.	Multi-Category Listings
• For Sale: Electronics, vehicles, real estate, etc.
• Jobs: All industries with Algeria-specific categories
• Services: Home services, professional services, etc.
• For Rent: Properties, vehicles, equipment
3.	Algeria-Specific Features
• All 58 Wilayas with major cities
• French/Arabic language support
• DZD currency formatting
• Local phone number validation
4.	Real-Time Chat
• Direct messaging between buyers/sellers
• Real-time message delivery
• Message read status
• Photo sharing in chat
5.	Search and Discovery
• Category-based filtering
• Location-based search (Wilaya/city)
• Price range filtering
• Keyword search
• Nearby items with GPS
6.	Trust and Safety
• User ratings and reviews
• User blocking functionality
• Listing reporting system
• Profile verification status
7.	PWA Features
• Offline browsing of cached listings
• Install prompt for mobile devices
• Push notifications
• App-like navigation
• Service worker caching
Technical Implementation
Supabase Configuration
Client-side (src/lib/supabase/client.ts):
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
export const supabase = createClientComponentClient()
Server-side (src/lib/supabase/server.ts):
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
export const createServerSupabaseClient = () => {
return createServerComponentClient({ cookies })
}
Row Level Security (RLS)
All tables have RLS enabled with policies:
• Users can only see/modify their own data
• Public listings are viewable by everyone
• Chat messages only visible to conversation participants
• Reviews and profiles are publicly readable
PWA Configuration
next.config.ts:
import withPWA from 'next-pwa'
const pwaConfig = withPWA({
dest: 'public',
register: true,
skipWaiting: true,
runtimeCaching: [
// Supabase API caching
// API routes caching
]
})
Development Workflow
Current Status
• ✅ Project setup complete
• ✅ Supabase backend configured
• ✅ Database schema implemented
• ✅ PWA configuration ready
• ✅ Connection testing successful
Next Steps
1. Authentication System - Sign up/sign in pages
2. Core UI Components - Buttons, forms, cards, layouts
3. Listing System - Create/edit/view listings
4. Search Interface - Browse and filter listings
5. Chat System - Real-time messaging
6. User Profiles - Profile management and ratings
7. PWA Features - Offline mode, notifications
8. Testing & Deployment - Quality assurance and production deploy
Development Commands
Start development server
npm run dev
Build for production
npm run build
Start production server
npm start
Run linting
npm run lint
Install dependencies
npm install
Testing
• Connection Test: http://localhost:3000/test-connection
• Supabase Dashboard: Access via Supabase project dashboard
• Storage: Images stored in listing-photos bucket
Deployment
Recommended: Vercel
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push
Environment Variables for Production
• Update NEXT_PUBLIC_APP_URL to production domain
• Generate VAPID keys for push notifications
• Ensure all Supabase keys are production-ready
Security Considerations
1. Environment Variables: Never commit .env.local to version control
2. API Keys: Only use anon key in frontend, service role key server-side only
3. RLS Policies: All database access controlled by Row Level Security
4. File Uploads: Photos validated and sanitized before storage
5. User Input: All forms validated on both client and server side
Maintenance
Regular Tasks
• Monitor Supabase usage and storage
• Update dependencies regularly
• Review and update RLS policies as needed
• Monitor PWA performance metrics
• Backup database regularly
Scaling Considerations
• Supabase automatically scales for most use cases
• Consider CDN for static assets if traffic grows
• Monitor database query performance
• Implement pagination for large result sets
Contact & Support
For technical questions or contributions, refer to this documentation and the code comments throughout the project.
asf
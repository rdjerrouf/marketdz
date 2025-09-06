# MarketDZ 🇩🇿

An Algerian marketplace application built with Next.js and Supabase.

## Features

- 🛍️ Browse marketplace listings (For Sale, Jobs, Services, Rentals)
- 🏠 Location-based filtering by Algerian Wilayas
- 🔍 Search and filter functionality
- 💰 Price range filtering
- 👤 User authentication
- ⭐ User ratings and reviews
- 💬 Real-time messaging
- 📱 Responsive PWA design

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **PWA**: Progressive Web App with offline support
- **Deployment**: Vercel

## Getting Started

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
Create `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. **Run the development server**:
```bash
npm run dev
```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses a comprehensive database schema with:
- **User profiles** with Algeria-specific location data
- **Listings** for multiple categories (for_sale, job, service, for_rent)
- **Real-time messaging** between users
- **Favorites system** for saved listings
- **Reviews and ratings** for user trust
- **Row Level Security (RLS)** for data protection

## Core Features

### 🏪 Marketplace Categories
- **For Sale**: Electronics, vehicles, real estate, etc.
- **Jobs**: Employment opportunities across industries
- **Services**: Professional and home services
- **For Rent**: Properties, vehicles, equipment

### 🇩🇿 Algeria-Specific
- All 58 Wilayas with major cities
- DZD currency formatting
- Local phone number validation

### 🔒 Security & Trust
- User authentication with Supabase Auth
- User ratings and review system
- User blocking for safety
- Secure file uploads

## API Documentation

See `API_DOCUMENTATION.md` for detailed API endpoints and usage.

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
```

## Deployment

Deploy to Vercel:
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically on push

## License

This project is for educational and portfolio purposes.
# MarketDZ 🇩🇿

A modern Algerian marketplace application built with Next.js and Supabase.

## ✨ Features

- 🛍️ **Marketplace**: Browse listings across multiple categories
- 🏠 **Location-based**: Filtering by all 58 Algerian Wilayas  
- 🔍 **Advanced Search**: Full-text search with filters
- 👤 **User System**: Authentication, profiles, and ratings
- ⭐ **Reviews**: Comprehensive user rating system
- 💬 **Real-time Chat**: Live messaging between users
- � **Notifications**: Real-time notification system
- 📱 **PWA Ready**: Progressive web app with offline support

## 🚀 Tech Stack

- **Frontend**: Next.js 15.5.2, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Real-time**: WebSocket connections for messaging & notifications
- **Performance**: Optimized database queries and indexes

## 🏁 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 3. Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## 📚 Documentation

- **Development Guide**: See `DEVELOPMENT_GUIDE.md` for detailed setup
- **API Documentation**: See `API_DOCUMENTATION.md` for endpoints

## 🛠️ Development

```bash
npm run dev          # Development server
npm run build        # Production build  
npm run lint         # Code linting
supabase db push     # Deploy database changes
```

## 🇩🇿 Algeria Features

- **Wilayas**: All 58 Algerian provinces with major cities
- **Currency**: DZD formatting and validation  
- **Localization**: Arabic/French language support ready

## 📄 License

Educational and portfolio project.
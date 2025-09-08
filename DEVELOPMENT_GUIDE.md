# MarketDZ Development Guide

## 🚀 Project Overview
MarketDZ is a modern marketplace application built with Next.js 15.5.2, Supabase, and real-time features.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5.2 with App Router & Turbopack
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **Database**: PostgreSQL with RLS policies
- **Styling**: Tailwind CSS
- **Real-time**: Supabase Real-time subscriptions

### Core Features
- ✅ User Authentication & Profiles
- ✅ Listing Management (CRUD)
- ✅ Advanced Search & Filtering
- ✅ Favorites System
- ✅ User Rating & Review System
- ✅ Real-time Messaging
- ✅ Live Notifications
- ✅ Performance Optimization

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── browse/            # Browse listings
│   ├── messages/          # Real-time messaging
│   └── ...
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── chat/             # Real-time chat components
│   ├── listings/         # Listing components
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
└── types/                # TypeScript definitions
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Database migrations
supabase db push

# Reset database
supabase db reset
```

## 🔧 Key Components

### Real-time Features
- **ChatInterface**: WhatsApp-style messaging
- **NotificationsDropdown**: Live notification system
- **ConversationsList**: Real-time conversation management

### Custom Hooks
- **useAuth**: Authentication state management
- **useFavorites**: Favorites functionality
- **useRealtime**: Real-time messaging & notifications
- **useReviews**: Rating and review system

### API Endpoints
- `/api/auth/*` - Authentication
- `/api/listings/*` - Listing management
- `/api/favorites/*` - Favorites system
- `/api/reviews/*` - Rating system
- `/api/messages/*` - Real-time messaging
- `/api/notifications/*` - Notification system

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles and settings
- `listings` - Marketplace listings
- `favorites` - User favorites
- `reviews` - User ratings and reviews
- `messages` - Real-time messages
- `conversations` - Message conversations
- `notifications` - System notifications

### Performance Features
- Materialized views for listing aggregates
- Optimized indexes for search queries
- Full-text search with GIN indexes
- Real-time subscriptions with RLS policies

## 🚀 Production Deployment

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Deployment Steps
1. Build the application: `npm run build`
2. Deploy to your hosting platform
3. Set up environment variables
4. Run database migrations
5. Configure real-time subscriptions

## 🔍 Monitoring & Performance

### Key Metrics
- Database query performance (target: <100ms)
- Real-time connection health
- User engagement metrics
- Search performance analytics

### Performance Optimizations
- Database indexes for all search queries
- Materialized views for aggregate data
- Connection pooling (when available)
- Query optimization and monitoring

## 🐛 Troubleshooting

### Common Issues
1. **Authentication**: Check Supabase configuration and RLS policies
2. **Real-time**: Verify subscription filters and database permissions
3. **Performance**: Check database indexes and query plans
4. **Build errors**: Ensure all TypeScript types are correct

### Debug Commands
```bash
# Check database health
supabase status

# View real-time logs
supabase logs

# Test database connection
npm run test:db
```

## 📝 Contributing

1. Follow TypeScript best practices
2. Use proper error handling
3. Implement comprehensive tests
4. Document new features
5. Maintain performance standards

---

**Last Updated**: September 7, 2025
**Version**: 1.0.0

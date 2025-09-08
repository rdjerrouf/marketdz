# Supabase Configuration Checklist

## ✅ Database Structure Status

### Core Tables
- ✅ **profiles** - User profiles with ratings and verification
- ✅ **listings** - Marketplace listings with categories
- ✅ **favorites** - User favorites system
- ✅ **reviews** - User rating and review system
- ✅ **messages** - Real-time messaging
- ✅ **conversations** - Message conversations
- ✅ **notifications** - System notifications

### Performance Optimizations
- ✅ **Search Indexes** - GIN full-text search on listings
- ✅ **Composite Indexes** - Multi-column search optimization
- ✅ **Foreign Key Indexes** - All relationships indexed
- ✅ **Materialized Views** - Listing aggregate statistics

## ✅ Real-time Features Status

### Real-time Subscriptions
- ✅ **Messages Table** - Real-time messaging enabled
- ✅ **Conversations Table** - Live conversation updates
- ✅ **Notifications Table** - Live notification system
- ✅ **Favorites Table** - Real-time favorite updates

### RLS Policies
- ✅ **Conversations RLS** - Users can only see their conversations
- ✅ **Messages RLS** - Users can only see messages in their conversations
- ✅ **Notifications RLS** - Users can only see their notifications
- ✅ **Listings RLS** - Public read, owner can modify
- ✅ **Profiles RLS** - Public read, owner can modify
- ✅ **Reviews RLS** - Public read, authenticated users can create
- ✅ **Favorites RLS** - Owner can view/modify their favorites

## 🔧 Configuration to Verify

### 1. Production Database Setup
**Run these commands in your Supabase SQL Editor:**

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if all indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 2. Real-time Publications
**Verify real-time is enabled for these tables:**

```sql
-- Check current real-time publications
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Should include: conversations, messages, notifications, favorites
```

### 3. Storage Buckets
**Check if storage buckets are configured:**

- ✅ **avatars** bucket for user profile images
- ✅ **listings** bucket for listing photos
- ✅ **documents** bucket for any documents

### 4. Auth Configuration
**Verify authentication settings:**

- ✅ **Email/Password** authentication enabled
- ✅ **Email confirmations** configured
- ✅ **Password reset** emails configured
- ✅ **Site URL** set to your domain
- ✅ **Redirect URLs** configured for auth flows

### 5. Environment Variables
**Local Development:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Production:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 Missing Features to Add

### 1. Storage Policies
```sql
-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Public avatar access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

### 2. Database Functions
```sql
-- Function to update user rating when review is added
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE reviewed_id = NEW.reviewed_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewed_id = NEW.reviewed_id
    )
  WHERE id = NEW.reviewed_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating on review insert/update/delete
CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();
```

### 3. Real-time Filters
**In your client code, ensure proper real-time filtering:**

```javascript
// Messages subscription with user filter
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=in.(${userConversationIds})`
  }, payload => {
    // Handle message updates
  })
  .subscribe()
```

## 🔍 Testing Checklist

### Local Development Tests
- [ ] Can start Supabase locally (`supabase start`)
- [ ] All migrations apply successfully
- [ ] Can connect to local database
- [ ] Real-time subscriptions work locally

### Production Tests
- [ ] All tables exist with correct schema
- [ ] RLS policies prevent unauthorized access
- [ ] Real-time subscriptions work in production
- [ ] File uploads work (storage buckets)
- [ ] Email authentication works
- [ ] Performance is acceptable (query times < 100ms)

## 📋 Next Steps

1. **Run the verification queries** in your Supabase SQL Editor
2. **Enable real-time** for missing tables if needed
3. **Set up storage buckets** if not already configured
4. **Test the application** end-to-end in production
5. **Monitor performance** using the provided monitoring queries

---

**Last Updated**: September 7, 2025  
**Status**: Local development configured ✅ | Production verification needed 🔄

# MarketDZ Database Structure Documentation
*Updated after Messaging System Enhancement - September 5, 2025*

## 🎯 **Database Overview**
- **Database Type**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Security**: Row Level Security (RLS) enabled
- **Real-time**: Supabase Realtime subscriptions

---

## 📊 **Custom Types & Enums**

### **listing_category**
```sql
CREATE TYPE listing_category AS ENUM (
  'for_sale',
  'job',
  'service',
  'for_rent'
);
```

### **listing_status**
```sql
CREATE TYPE listing_status AS ENUM (
  'active',
  'sold', 
  'deleted'
);
```

### **message_type** *(Enhanced)*
```sql
CREATE TYPE message_type AS ENUM (
  'text',
  'image',
  'file',      -- ✨ NEW
  'system'
);
```

---

## 🗄️ **Core Tables**

## 👤 **User Management**

### **profiles** *extends auth.users*
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,                    -- References auth.users(id)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  bio TEXT,
  phone TEXT,
  avatar_url TEXT,
  city TEXT,
  wilaya TEXT,
  rating NUMERIC(3,2) DEFAULT 0.0,        -- 0.0 to 5.0
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Constraints:**
- Rating: 0.0 ≤ rating ≤ 5.0
- Review count: ≥ 0

**Indexes:**
- `idx_profiles_wilaya` on wilaya

---

## 🏪 **Marketplace**

### **listings** *Product/Service listings*
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,                  -- FK to profiles(id)
  category listing_category NOT NULL,
  subcategory TEXT,
  title TEXT NOT NULL,                    -- 3-200 chars
  description TEXT,
  price NUMERIC(12,2),                    -- ≥ 0
  status listing_status DEFAULT 'active',
  location_city TEXT,
  location_wilaya TEXT,
  photos TEXT[] DEFAULT '{}',             -- Array of photo URLs
  metadata JSONB DEFAULT '{}',            -- Flexible data
  location JSONB,                         -- Geographic data
  views_count INTEGER DEFAULT 0,          -- ≥ 0
  favorites_count INTEGER DEFAULT 0,      -- ≥ 0 (auto-updated)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()   -- Auto-updated on change
);
```

**Indexes:**
- `idx_listings_category` on category
- `idx_listings_created_at` on created_at DESC
- `idx_listings_price` on price
- `idx_listings_status` on status
- `idx_listings_user_id` on user_id
- `idx_listings_wilaya` on location_wilaya

---

## 💬 **Enhanced Messaging System**

### **conversations** *Chat conversations* *(Enhanced)*
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  buyer_id UUID NOT NULL,                 -- FK to profiles(id)
  seller_id UUID NOT NULL,                -- FK to profiles(id)
  listing_id UUID,                        -- FK to listings(id), optional
  last_message_id UUID,                   -- ✨ NEW: FK to messages(id)
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  buyer_unread_count INTEGER DEFAULT 0,   -- ✨ NEW: Unread count for buyer
  seller_unread_count INTEGER DEFAULT 0,  -- ✨ NEW: Unread count for seller
  status TEXT DEFAULT 'active',           -- ✨ NEW: active/archived/blocked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),   -- ✨ NEW: Auto-updated
  
  UNIQUE(buyer_id, seller_id, listing_id) -- One conversation per context
);
```

**Indexes:**
- `idx_conversations_buyer_id` on buyer_id
- `idx_conversations_seller_id` on seller_id
- `conversations_last_message_at_idx` on last_message_at DESC

### **messages** *Individual messages* *(Enhanced)*
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,          -- FK to conversations(id)
  sender_id UUID NOT NULL,                -- FK to profiles(id)
  content TEXT NOT NULL,                  -- Non-empty for text messages
  message_type message_type DEFAULT 'text',
  metadata JSONB DEFAULT '{}',            -- ✨ NEW: File info, etc.
  read_at TIMESTAMPTZ,                    -- When message was read
  edited_at TIMESTAMPTZ,                  -- ✨ NEW: When message was edited
  deleted_at TIMESTAMPTZ,                 -- ✨ NEW: Soft delete timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_messages_conversation_id` on conversation_id
- `idx_messages_created_at` on created_at DESC
- `messages_conversation_created_idx` on (conversation_id, created_at DESC)

---

## ⭐ **Social Features**

### **favorites** *User saved listings*
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,                  -- FK to profiles(id)
  listing_id UUID NOT NULL,               -- FK to listings(id)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, listing_id)             -- One favorite per user per listing
);
```

**Indexes:**
- `idx_favorites_user_id` on user_id
- `idx_favorites_listing_id` on listing_id

### **reviews** *User ratings and feedback*
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  reviewer_id UUID NOT NULL,              -- FK to profiles(id)
  reviewed_id UUID NOT NULL,              -- FK to profiles(id)
  listing_id UUID,                        -- FK to listings(id), optional
  rating INTEGER NOT NULL,                -- 1-5 stars
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(reviewer_id, reviewed_id, listing_id) -- One review per context
);
```

**Indexes:**
- `idx_reviews_reviewed_id` on reviewed_id

### **blocked_users** *User blocking system*
```sql
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY,
  blocker_id UUID NOT NULL,               -- FK to profiles(id)
  blocked_id UUID NOT NULL,               -- FK to profiles(id)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(blocker_id, blocked_id)          -- One block record per pair
);
```

---

## 🔔 **Notifications**

### **push_subscriptions** *Web push notification endpoints*
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,                  -- FK to profiles(id)
  endpoint TEXT NOT NULL,                 -- Push service endpoint
  p256dh TEXT NOT NULL,                   -- Encryption key
  auth TEXT NOT NULL,                     -- Auth token
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, endpoint)               -- One subscription per endpoint per user
);
```

---

## 🔧 **Database Functions**

### **Messaging Functions** *(New)*
```sql
-- Mark messages as read and update unread counts
mark_messages_as_read(conversation_uuid UUID, user_uuid UUID) RETURNS INTEGER

-- Find existing or create new conversation
get_or_create_conversation(buyer_uuid UUID, seller_uuid UUID, listing_uuid UUID) RETURNS UUID

-- Auto-update conversation on new message
update_conversation_last_message() RETURNS TRIGGER
```

### **Existing Functions**
```sql
-- Create user profile on signup
handle_new_user() RETURNS TRIGGER

-- Advanced listing search with filters and ranking
search_listings(...) RETURNS TABLE(...)

-- Update favorites count on listings
update_favorites_count() RETURNS TRIGGER

-- Update user rating based on reviews
update_user_rating() RETURNS TRIGGER

-- Auto-update updated_at columns
update_updated_at_column() RETURNS TRIGGER
```

---

## 🔒 **Security (RLS Policies)**

### **Key Security Features:**
- ✅ **Authentication Required**: Most operations require auth.uid()
- ✅ **Owner-Only Access**: Users can only modify their own data
- ✅ **Conversation Privacy**: Only participants can access messages
- ✅ **Public Visibility**: Active listings and profiles are publicly viewable
- ✅ **Granular Permissions**: Separate policies for SELECT, INSERT, UPDATE, DELETE

### **Messaging Security:**
- Users can only view conversations they participate in
- Users can only send messages in their conversations
- Users can only update their own messages
- Automatic conversation access validation

---

## 📈 **Performance Optimizations**

### **Strategic Indexes:**
- **Time-based**: created_at DESC for chronological queries
- **Filtering**: category, status, wilaya for search filters
- **Relationships**: All foreign keys indexed
- **Messaging**: Optimized for conversation loading and message pagination

### **Real-time Subscriptions:**
- Conversation updates
- New message notifications
- Listing status changes
- User activity tracking

---

## 🎯 **Key Features Supported**

### **Marketplace:**
- ✅ Multi-category listings with photos
- ✅ Location-based filtering (Wilaya/City)
- ✅ Price-based search and sorting
- ✅ User favorites and view tracking
- ✅ Advanced full-text search

### **Messaging:**
- ✅ Real-time conversations
- ✅ Unread count tracking
- ✅ Message pagination (20 messages initial load)
- ✅ File/image message support
- ✅ Message read status
- ✅ Conversation archiving/blocking

### **Social:**
- ✅ User ratings and reviews
- ✅ Profile verification system
- ✅ User blocking capabilities
- ✅ Push notifications

### **Performance:**
- ✅ Optimized database queries
- ✅ Efficient pagination
- ✅ Real-time subscriptions
- ✅ Caching-friendly structure

---

## 🚀 **Recent Enhancements**
*Applied September 5, 2025*

1. **Enhanced Messaging System**
   - Added unread count tracking
   - Message metadata support
   - Conversation status management
   - Enhanced foreign key relationships

2. **Performance Improvements**
   - Optimized indexes for messaging
   - Automatic conversation updates
   - Efficient read status marking

3. **Type System Enhancement**
   - Added 'file' message type
   - Enhanced constraint validation
   - Improved data integrity

---

## 🚀 **Performance & Scaling Considerations**

### **Database Performance Optimizations**

#### **Favorites Count Synchronization**
The `favorites_count` field in the `listings` table requires careful handling to prevent race conditions:

**Current Implementation:**
```sql
-- Trigger-based counting (implemented)
CREATE OR REPLACE FUNCTION update_listing_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT/DELETE on favorites table
  -- Update listings.favorites_count accordingly
END;
$$ LANGUAGE plpgsql;
```

**Scaling Concerns:**
- High-traffic listings may experience lock contention on favorites_count updates
- Consider implementing eventual consistency for non-critical counters
- Alternative: Periodic batch updates for favorites_count instead of real-time

#### **Search Performance**
Current search implementation includes:
- Full-text search on title/description
- Category and location filtering
- Price range queries

**Optimization Recommendations:**
```sql
-- Additional indexes for search performance
CREATE INDEX CONCURRENTLY idx_listings_search_vector ON listings USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX CONCURRENTLY idx_listings_category_location ON listings(category, location_wilaya);
CREATE INDEX CONCURRENTLY idx_listings_price_range ON listings(price) WHERE status = 'active';
```

#### **Message Storage Strategy**
For file attachments and future features:
```sql
-- Consider separate table for large message content
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES messages(id),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Monitoring & Maintenance**
- Monitor slow queries using `pg_stat_statements`
- Regular `VACUUM ANALYZE` on high-traffic tables
- Archive old messages based on retention policy
- Consider partitioning for conversations table by created_at

---

This database structure provides a solid foundation for a full-featured marketplace with advanced messaging capabilities, user management, and social features, all optimized for performance and security.

# MarketDZ Database Schema Documentation

**Last Updated**: 2025-10-01
**Database Version**: Clean Lean Schema with Role-Based Admin RLS
**Total Migrations**: 6

---

## Table of Contents

1. [Overview](#overview)
2. [Tables](#tables)
3. [Indexes](#indexes)
4. [Functions](#functions)
5. [Triggers](#triggers)
6. [RLS Policies](#rls-policies)
7. [Enums](#enums)

---

## Overview

### Database Philosophy: Lean & Optimized

This database follows a **minimal, production-ready** approach with:
- **12 core tables** (marketplace + admin system)
- **43 strategic indexes** (no bloat, each proven necessary)
- **7 essential functions** (RLS helpers + maintenance)
- **6 triggers** (automated updates only)
- **33 RLS policies** (role-based security)

⚠️ **CRITICAL**: Do NOT add indexes/triggers without performance testing. Previous system broke from manual additions.

---

## Tables

### 1. Core Marketplace Tables

#### **profiles**
User account profiles (linked to auth.users)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | - | Primary key (matches auth.users.id) |
| first_name | text | NO | '' | User's first name |
| last_name | text | NO | '' | User's last name |
| email | text | YES | null | User's email address |
| phone | text | YES | null | Phone number |
| city | text | YES | null | City location |
| wilaya | text | YES | null | Wilaya/province (Algeria) |
| bio | text | YES | null | User biography |
| avatar_url | text | YES | null | Profile picture URL |
| rating | numeric | NO | 0.0 | Average user rating |
| review_count | integer | NO | 0 | Number of reviews received |
| is_verified | boolean | NO | false | Verification status |
| status | text | NO | 'active' | Account status (active/suspended/banned) |
| created_at | timestamptz | NO | now() | Account creation time |
| updated_at | timestamptz | NO | now() | Last update time |

**Constraints**:
- `profiles_status_check`: status IN ('active', 'suspended', 'banned')

**Indexes**:
- `profiles_pkey` (PRIMARY KEY on id)
- `idx_profiles_wilaya` (for geographic filtering)
- `idx_profiles_status` (for admin user management)

**RLS Policies**:
- Public profiles viewable by all
- Users can insert/update their own profile
- Admins can view all profiles and update user status

---

#### **listings**
Marketplace item listings

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | - | Owner (references profiles.id) |
| category | listing_category | NO | - | Main category (enum) |
| subcategory | text | YES | null | Subcategory |
| title | text | NO | - | Listing title |
| description | text | YES | null | Full description |
| price | numeric | YES | null | Item price in DZD |
| status | listing_status | NO | 'active' | Listing status (enum) |
| location_city | text | YES | null | City location |
| location_wilaya | text | YES | null | Wilaya/province |
| photos | text[] | YES | '{}' | Array of photo URLs |
| metadata | jsonb | YES | '{}' | Additional category-specific data |
| views_count | integer | NO | 0 | Total views |
| favorites_count | integer | NO | 0 | Times favorited |
| available_from | date | YES | null | Availability start (rentals) |
| available_to | date | YES | null | Availability end (rentals) |
| rental_period | text | YES | null | Rental period type |
| salary_min | integer | YES | null | Min salary (jobs) |
| salary_max | integer | YES | null | Max salary (jobs) |
| job_type | text | YES | null | Job type (full-time/part-time) |
| company_name | text | YES | null | Company name (jobs) |
| condition | text | YES | null | Item condition (new/used) |
| search_vector | tsvector | YES | null | Full-text search vector |
| is_hot_deal | boolean | YES | false | Hot deal flag |
| hot_deal_expires_at | timestamptz | YES | null | Hot deal expiration |
| hot_deal_badge_type | text | YES | null | Badge type (limited/flash/discount) |
| original_price | numeric | YES | null | Original price (for discounts) |
| created_at | timestamptz | NO | now() | Creation time |
| updated_at | timestamptz | NO | now() | Last update time |

**Indexes**:
- `listings_pkey` (PRIMARY KEY on id)
- `idx_listings_user_id` (for user's listings)
- `idx_listings_fulltext` (GIN index for text search)
- `idx_listings_search_compound` (compound index for complex filtering)
- `listings_search_vector_gin` (GIN index for Arabic search)
- `idx_listings_hot_deals` (for hot deals page)

**RLS Policies**:
- Active listings viewable by everyone
- Users can view their own non-active listings
- Users can create/update/delete their own listings

---

#### **favorites**
User favorites/bookmarks

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | - | User who favorited |
| listing_id | uuid | NO | - | Favorited listing |
| created_at | timestamptz | NO | now() | When favorited |

**Constraints**:
- `favorites_user_id_listing_id_key` (UNIQUE on user_id, listing_id)

**Indexes**:
- `favorites_pkey` (PRIMARY KEY on id)
- `idx_favorites_listing_id` (for favorite counts)

**RLS Policies**:
- Users can view/create/delete their own favorites

---

#### **reviews**
User reviews and ratings

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| reviewer_id | uuid | NO | - | User giving review |
| reviewed_id | uuid | NO | - | User being reviewed |
| listing_id | uuid | YES | null | Related listing |
| rating | integer | NO | - | Rating (1-5) |
| comment | text | YES | null | Review text |
| created_at | timestamptz | NO | now() | Review time |

**Constraints**:
- `reviews_reviewer_id_reviewed_id_listing_id_key` (UNIQUE composite)

**Indexes**:
- `reviews_pkey` (PRIMARY KEY on id)
- `idx_reviews_reviewed_id` (for user's received reviews)

**RLS Policies**:
- Reviews are public (viewable by all)
- Users can create/delete their own reviews

---

### 2. Messaging System

#### **conversations**
Message conversations between users

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| buyer_id | uuid | NO | - | Buyer user |
| seller_id | uuid | NO | - | Seller user |
| listing_id | uuid | YES | null | Related listing |
| last_message_id | uuid | YES | null | Latest message reference |
| last_message_at | timestamptz | YES | now() | Last message time |
| buyer_unread_count | integer | NO | 0 | Buyer's unread count |
| seller_unread_count | integer | NO | 0 | Seller's unread count |
| created_at | timestamptz | NO | now() | Conversation start |
| updated_at | timestamptz | NO | now() | Last update |

**Indexes**:
- `conversations_pkey` (PRIMARY KEY on id)
- `idx_conversations_users` (for user's conversations)

**RLS Policies**:
- Users can see their own conversations (buyer or seller)
- Users can create conversations where they are buyer or seller

---

#### **messages**
Individual messages in conversations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| conversation_id | uuid | NO | - | Parent conversation |
| sender_id | uuid | NO | - | Message sender |
| content | text | NO | - | Message text |
| read_at | timestamptz | YES | null | When read (null = unread) |
| created_at | timestamptz | NO | now() | Message time |

**Indexes**:
- `messages_pkey` (PRIMARY KEY on id)
- `idx_messages_conversation_time` (for message history)
- `idx_messages_unread` (for unread counts)

**RLS Policies**:
- Users can view messages in their conversations
- Users can send messages in their conversations

---

### 3. Notifications

#### **notifications**
User notifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | - | Notification recipient |
| type | text | NO | - | Notification type |
| title | text | NO | - | Notification title |
| message | text | NO | - | Notification message |
| data | jsonb | YES | '{}' | Additional data |
| read_at | timestamptz | YES | null | When read (null = unread) |
| created_at | timestamptz | NO | now() | Notification time |

**Indexes**:
- `notifications_pkey` (PRIMARY KEY on id)
- `idx_notifications_user_unread` (for unread notifications)
- `idx_notifications_user_all` (for notification history)

**RLS Policies**:
- Users can view their own notifications
- Users can update their own notifications (mark as read)

---

### 4. Admin System

#### **admin_users**
Admin accounts with role-based permissions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | - | References profiles.id (UNIQUE) |
| role | text | NO | 'support' | Admin role |
| permissions | jsonb | NO | '{}' | Additional permissions |
| is_active | boolean | NO | true | Admin account status |
| notes | text | YES | null | Admin notes |
| created_at | timestamptz | NO | now() | Admin creation time |
| updated_at | timestamptz | NO | now() | Last update |
| last_login_at | timestamptz | YES | null | Last login time |

**Constraints**:
- `admin_users_role_check`: role IN ('super_admin', 'admin', 'moderator', 'support')
- `admin_users_user_id_key` (UNIQUE on user_id)

**Indexes**:
- `admin_users_pkey` (PRIMARY KEY on id)
- `idx_admin_users_user_active` (partial index for active admins)
- `idx_admin_users_role` (for role filtering)

**RLS Policies**:
- Admins can view all admin users
- Super admins can create/update/delete admin users

---

#### **admin_sessions**
Admin login session tracking

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| admin_user_id | uuid | NO | - | References admin_users.id |
| session_token | text | NO | - | Unique session token |
| ip_address | text | YES | null | Login IP address |
| user_agent | text | YES | null | Browser user agent |
| is_active | boolean | NO | true | Session active status |
| logout_reason | text | YES | null | Why session ended |
| created_at | timestamptz | NO | now() | Session start |
| last_activity_at | timestamptz | NO | now() | Last activity |
| expires_at | timestamptz | NO | - | Session expiration |

**Constraints**:
- `admin_sessions_session_token_key` (UNIQUE on session_token)

**Indexes**:
- `admin_sessions_pkey` (PRIMARY KEY on id)
- `idx_admin_sessions_token` (partial index for active sessions)
- `idx_admin_sessions_admin` (for admin's sessions)
- `idx_admin_sessions_expiry` (for cleanup)

**RLS Policies**:
- Admins can view/create/update their own sessions

---

#### **admin_activity_logs**
Audit trail of admin actions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| admin_user_id | uuid | YES | null | Admin who performed action |
| action | text | NO | - | Action type |
| target_type | text | YES | null | Type of target entity |
| target_id | text | YES | null | ID of target entity |
| details | jsonb | YES | '{}' | Action details |
| ip_address | text | YES | null | IP address |
| created_at | timestamptz | NO | now() | Action time |

**Indexes**:
- `admin_activity_logs_pkey` (PRIMARY KEY on id)
- `idx_admin_logs_admin_time` (for admin's activity)
- `idx_admin_logs_target` (for entity audit trail)
- `idx_admin_logs_action_time` (for action filtering)

**RLS Policies**:
- Admins can view all logs
- Admins can create their own logs

---

#### **admin_invitations**
Admin invitation system

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| email | text | NO | - | Invited email (UNIQUE) |
| invited_by | uuid | YES | null | Admin who sent invite |
| role | text | NO | - | Proposed admin role |
| invitation_token | text | NO | - | Unique invite token |
| expires_at | timestamptz | NO | - | Invitation expiration |
| accepted_at | timestamptz | YES | null | When accepted (null = pending) |
| created_at | timestamptz | NO | now() | Invitation time |

**Constraints**:
- `admin_invitations_email_key` (UNIQUE on email)
- `admin_invitations_invitation_token_key` (UNIQUE on invitation_token)
- `admin_invitations_email_check` (email format validation)

**Indexes**:
- `admin_invitations_pkey` (PRIMARY KEY on id)
- `idx_admin_invites_token` (partial index for pending invites)
- `idx_admin_invites_email` (partial index for pending invites)

**RLS Policies**:
- Admins can view invitations
- Super admins can create invitations

---

### 5. Utility Tables

#### **arabic_stopwords**
Arabic stopwords for search filtering

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| word | text | NO | - | Arabic stopword |

**Indexes**:
- `arabic_stopwords_pkey` (PRIMARY KEY on word)

**RLS Policies**:
- Stopwords are public (viewable by all)

---

## Indexes

### Index Summary (43 Total)

**Critical for Performance** (11 marketplace indexes):
1. `idx_profiles_wilaya` - Geographic filtering
2. `idx_listings_user_id` - User's listings
3. `idx_listings_fulltext` - English full-text search
4. `listings_search_vector_gin` - Arabic full-text search
5. `idx_listings_search_compound` - Complex filtering
6. `idx_listings_hot_deals` - Hot deals page
7. `idx_favorites_listing_id` - Favorite counts
8. `idx_reviews_reviewed_id` - User reviews
9. `idx_conversations_users` - User conversations
10. `idx_messages_conversation_time` - Message ordering
11. `idx_messages_unread` - Unread message counts

**Notifications** (2 indexes):
12. `idx_notifications_user_unread` - Unread notifications
13. `idx_notifications_user_all` - Notification history

**Admin System** (12 indexes):
14-17. Admin users indexes (role, user_active)
18-21. Admin sessions indexes (token, admin, expiry)
22-24. Admin logs indexes (admin_time, target, action_time)
25-26. Admin invitations indexes (email, token)

**Admin Status Index**:
27. `idx_profiles_status` - User status filtering (for admin)

**Primary Keys** (18 indexes):
- All tables have primary key indexes

**Unique Constraints** (8 indexes):
- favorites: user_id + listing_id
- reviews: reviewer_id + reviewed_id + listing_id
- admin_users: user_id
- admin_sessions: session_token
- admin_invitations: email, invitation_token

---

## Functions

### 1. `is_admin()` → boolean
**Security**: SECURITY DEFINER
**Purpose**: Check if current user is an active admin
**Used in**: RLS policies for admin access control

```sql
RETURNS boolean
-- Returns true if auth.uid() is in admin_users with is_active = true
```

---

### 2. `current_admin()` → TABLE
**Security**: SECURITY DEFINER
**Purpose**: Get current admin user details
**Returns**: id, user_id, role, permissions, is_active

```sql
RETURNS TABLE(id uuid, user_id uuid, role text, permissions jsonb, is_active boolean)
-- Returns admin record for auth.uid()
```

---

### 3. `check_admin_status(check_user_id uuid)` → TABLE
**Security**: SECURITY DEFINER
**Purpose**: Check if specific user is admin
**Returns**: Full admin_users record

```sql
RETURNS TABLE(id, user_id, role, permissions, is_active, notes, created_at, updated_at, last_login_at)
-- Returns admin record for given user_id
```

---

### 4. `cleanup_expired_admin_sessions()` → integer
**Purpose**: Deactivate expired admin sessions
**Returns**: Number of sessions deactivated
**Usage**: Call periodically via cron

```sql
RETURNS integer
-- Sets is_active = false, logout_reason = 'timeout' for expired sessions
```

---

### 5. `expire_hot_deals()` → void
**Purpose**: Expire hot deals past their expiration time
**Usage**: Call periodically via cron

```sql
RETURNS void
-- Sets is_hot_deal = FALSE for expired hot deals
```

---

### 6. `update_updated_at_column()` → trigger
**Purpose**: Auto-update updated_at timestamps
**Used on**: profiles, listings, conversations

```sql
RETURNS trigger
-- Sets NEW.updated_at = now() before UPDATE
```

---

### 7. `handle_new_user()` → trigger
**Purpose**: Auto-create profile when auth user created
**Used on**: auth.users (INSERT)

```sql
RETURNS trigger
-- Creates profile record with data from auth.users
```

---

### 8. `listings_search_vector_trigger()` → trigger
**Purpose**: Update search_vector for Arabic search
**Used on**: listings (INSERT/UPDATE)

```sql
RETURNS trigger
-- Updates search_vector using custom Arabic tokenization
```

---

### 9. `update_admin_users_updated_at()` → trigger
**Purpose**: Auto-update admin_users.updated_at
**Used on**: admin_users (UPDATE)

```sql
RETURNS trigger
-- Sets NEW.updated_at = now() before UPDATE
```

---

## Triggers

### 1. `on_auth_user_created`
- **Table**: auth.users
- **Timing**: AFTER INSERT
- **Function**: handle_new_user()
- **Purpose**: Auto-create profile for new user

### 2. `update_profiles_updated_at`
- **Table**: profiles
- **Timing**: BEFORE UPDATE
- **Function**: update_updated_at_column()
- **Purpose**: Auto-update updated_at timestamp

### 3. `listings_search_vector_update`
- **Table**: listings
- **Timing**: BEFORE INSERT
- **Function**: listings_search_vector_trigger()
- **Purpose**: Update Arabic search vector

### 4. `update_listings_updated_at`
- **Table**: listings
- **Timing**: BEFORE UPDATE
- **Function**: update_updated_at_column()
- **Purpose**: Auto-update updated_at timestamp

### 5. `update_conversations_updated_at`
- **Table**: conversations
- **Timing**: BEFORE UPDATE
- **Function**: update_updated_at_column()
- **Purpose**: Auto-update updated_at timestamp

### 6. `update_admin_users_updated_at`
- **Table**: admin_users
- **Timing**: BEFORE UPDATE
- **Function**: update_admin_users_updated_at()
- **Purpose**: Auto-update updated_at timestamp

---

## RLS Policies

### Summary: 33 Active Policies

**Admin System** (11 policies):
- admin_users: 4 policies (view/create/update/delete based on role)
- admin_sessions: 3 policies (view/create/update own sessions)
- admin_activity_logs: 2 policies (view all, create own)
- admin_invitations: 2 policies (view all, super_admin create)

**Profiles** (5 policies):
- Public profiles viewable by all
- Users insert/update own profile
- Admins view all profiles
- Admins update user status (except own)

**Listings** (5 policies):
- Active listings viewable by all
- Users view own non-active listings
- Users create/update/delete own listings

**Favorites** (3 policies):
- Users view/create/delete own favorites

**Reviews** (3 policies):
- Reviews public
- Users create/delete own reviews

**Conversations** (2 policies):
- Users view/create own conversations (as buyer or seller)

**Messages** (2 policies):
- Users view/send messages in their conversations

**Notifications** (2 policies):
- Users view/update own notifications

**Utility Tables** (1 policy):
- arabic_stopwords: public read access

---

## Enums

### `listing_category`
Marketplace item categories

**Values**:
- `for_sale` - Items for sale
- `job` - Job listings
- `service` - Service offerings
- `for_rent` - Items/property for rent

---

### `listing_status`
Listing lifecycle status

**Values**:
- `active` - Published and visible
- `sold` - Item sold
- `rented` - Item rented out
- `completed` - Job/service completed
- `expired` - Listing expired

---

## Migration History

1. **20250929000000_initial_lean_schema.sql** - Core marketplace schema
2. **20250929000001_add_full_text_search.sql** - Arabic full-text search
3. **20250929000002_add_listings_security_optimization.sql** - Security & performance
4. **20251001000001_add_hot_deals_support.sql** - Hot deals feature
5. **20251001000002_add_admin_system.sql** - Admin infrastructure
6. **20251001000004_add_role_based_rls.sql** - Role-based RLS (Gold Standard)

---

## Security Model

### Role-Based RLS (Gold Standard Pattern)

The database uses **role-based RLS** - the recommended Supabase security pattern:

✅ **Database-level security**: All access control enforced by RLS policies
✅ **No service_role bypass**: API routes use standard authenticated client
✅ **Single security model**: Unified approach for all users
✅ **Helper functions**: `is_admin()` for clean policy definitions

### Admin Role Hierarchy

1. **super_admin** - Full access, can manage other admins
2. **admin** - Can manage users and content
3. **moderator** - Can moderate content
4. **support** - Read-only access for support

**Relationship**: `admin_users.user_id` → `profiles.id` (1-to-1, UNIQUE constraint)
- One profile can have at most one admin account
- `is_admin()` function correctly checks `admin_users.is_active = true`
- Admin status is role-based via RLS policies

### User Status Values

1. **active** - Normal user (default)
2. **suspended** - Temporarily suspended by admin
3. **banned** - Permanently banned by admin

---

## Performance Notes

### Query Optimization

1. **Full-text search**: Uses GIN indexes on `search_vector` for Arabic search
2. **Geographic filtering**: `idx_profiles_wilaya` for location-based queries
3. **Compound index**: `idx_listings_search_compound` for complex listing filters
4. **Hot deals**: Dedicated index `idx_listings_hot_deals` for hot deals page
5. **Messaging**: `idx_messages_unread` with WHERE clause for fast unread counts

### Trigger Performance

**Arabic Search Trigger** (`listings_search_vector_update`):
- Overhead per INSERT: ~5ms
- Overhead per UPDATE: ~5ms
- **Trade-off**: Small latency cost for robust Arabic full-text search
- **Tested**: Performance acceptable for production use

### Maintenance Tasks

Run periodically (e.g., via cron):
```sql
-- Cleanup expired admin sessions
SELECT cleanup_expired_admin_sessions();

-- Expire old hot deals
SELECT expire_hot_deals();
```

---

## Best Practices

### Adding Indexes

⚠️ **DO NOT add indexes without**:
1. Proven performance issue via testing
2. Documentation in migration file
3. Local testing with real data
4. Approval before production deployment

### Modifying Schema

✅ **ALWAYS**:
1. Create migration file for ALL changes
2. Test locally with `npx supabase db reset`
3. Document purpose and impact
4. Deploy via `npx supabase db push`

❌ **NEVER**:
1. Manually modify production database
2. Add triggers without thorough testing
3. Bypass RLS with service_role in production
4. Create indexes "just in case"

---

**End of Schema Documentation**

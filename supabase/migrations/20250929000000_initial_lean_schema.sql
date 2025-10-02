-- =============================================================================
-- GOLDEN SCHEMA V1 - MARKETDZ
-- A clean, lean, and secure starting point for the beta launch.
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS & CUSTOM TYPES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.listing_category AS ENUM (
    'for_sale',
    'job',
    'service',
    'for_rent'
);

CREATE TYPE public.listing_status AS ENUM (
    'active',
    'sold',
    'rented',
    'completed',
    'expired'
);

-- =============================================================================
-- 2. CORE TABLES
-- =============================================================================

-- Profiles Table (Linked to auth.users)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text DEFAULT '' NOT NULL,
    last_name text DEFAULT '' NOT NULL,
    email text,
    phone text,
    city text,
    wilaya text,
    bio text,
    avatar_url text,
    rating numeric(3, 2) DEFAULT 0.0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT profiles_rating_check CHECK ((rating >= 0.0 AND rating <= 5.0)),
    CONSTRAINT profiles_review_count_check CHECK ((review_count >= 0))
);
COMMENT ON TABLE public.profiles IS 'Stores public user profile information, linked to auth.users.';

-- Listings Table
CREATE TABLE public.listings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category public.listing_category NOT NULL,
    subcategory text,
    title text NOT NULL,
    description text,
    price numeric(12, 2),
    status public.listing_status DEFAULT 'active'::public.listing_status NOT NULL,
    location_city text,
    location_wilaya text,
    photos text[] DEFAULT '{}'::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    views_count integer DEFAULT 0 NOT NULL,
    favorites_count integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    -- Category-specific columns
    available_from date,
    available_to date,
    rental_period text,
    salary_min integer,
    salary_max integer,
    job_type text,
    company_name text,
    condition text,
    CONSTRAINT listings_price_positive CHECK (((price >= (0)::numeric) OR (price IS NULL))),
    CONSTRAINT listings_title_length CHECK ((char_length(title) >= 3 AND char_length(title) <= 200))
);
COMMENT ON TABLE public.listings IS 'Core table for all marketplace items.';

-- Favorites Table
CREATE TABLE public.favorites (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT favorites_user_id_listing_id_key UNIQUE (user_id, listing_id)
);
COMMENT ON TABLE public.favorites IS 'Tracks which users have favorited which listings.';

-- Reviews Table
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_range CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviews_reviewer_id_reviewed_id_listing_id_key UNIQUE (reviewer_id, reviewed_id, listing_id)
);
COMMENT ON TABLE public.reviews IS 'Stores user-to-user reviews and ratings.';

-- Conversations Table
CREATE TABLE public.conversations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
    last_message_id uuid, -- Note: FK is added later after messages table exists
    last_message_at timestamptz DEFAULT now(),
    buyer_unread_count integer DEFAULT 0 NOT NULL,
    seller_unread_count integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT conversations_buyer_seller_different CHECK ((buyer_id <> seller_id))
);
COMMENT ON TABLE public.conversations IS 'Represents a chat thread between a buyer and a seller.';

-- Messages Table
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    read_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT messages_content_not_empty CHECK ((char_length(btrim(content)) > 0))
);
COMMENT ON TABLE public.messages IS 'Individual chat messages within a conversation.';

-- Add the missing FK constraint now that messages table exists
ALTER TABLE public.conversations ADD CONSTRAINT conversations_last_message_id_fkey FOREIGN KEY (last_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;

-- Notifications Table
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    read_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.notifications IS 'Stores notifications for users (e.g., new message, new review).';

-- Arabic Stopwords Table (for search)
CREATE TABLE public.arabic_stopwords (
    word text PRIMARY KEY
);
COMMENT ON TABLE public.arabic_stopwords IS 'List of common Arabic words to ignore during search.';


-- =============================================================================
-- 3. ESSENTIAL INDEXES (The Lean Set)
-- =============================================================================

-- Profiles
CREATE INDEX idx_profiles_wilaya ON public.profiles USING btree (wilaya);

-- Listings
CREATE INDEX idx_listings_user_id ON public.listings USING btree (user_id);
CREATE INDEX idx_listings_fulltext ON public.listings USING gin (to_tsvector('english'::regconfig, (COALESCE(title, ''::text) || ' '::text) || COALESCE(description, ''::text)));
CREATE INDEX idx_listings_search_compound ON public.listings USING btree (status, category, location_wilaya, price, created_at DESC) WHERE (status = 'active'::public.listing_status);

-- Favorites
CREATE INDEX idx_favorites_listing_id ON public.favorites USING btree (listing_id);

-- Reviews
CREATE INDEX idx_reviews_reviewed_id ON public.reviews USING btree (reviewed_id);

-- Conversations
CREATE INDEX idx_conversations_users ON public.conversations USING btree (buyer_id, seller_id, last_message_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation_time ON public.messages USING btree (conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages USING btree (conversation_id, read_at) WHERE (read_at IS NULL);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, read_at) WHERE (read_at IS NULL);
CREATE INDEX idx_notifications_user_all ON public.notifications USING btree (user_id, created_at DESC);


-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arabic_stopwords ENABLE ROW LEVEL SECURITY;

-- --- Profiles Policies ---
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id);

-- --- Listings Policies ---
CREATE POLICY "Active listings are viewable by everyone" ON public.listings FOR SELECT USING (status = 'active'::public.listing_status);
CREATE POLICY "Users can view their own non-active listings" ON public.listings FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can create listings" ON public.listings FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own listings" ON public.listings FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own listings" ON public.listings FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- --- Favorites Policies ---
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can create their own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- --- Reviews Policies ---
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = reviewer_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE TO authenticated USING ((select auth.uid()) = reviewer_id);

-- --- Conversations Policies ---
CREATE POLICY "Users can see their own conversations" ON public.conversations FOR SELECT TO authenticated USING (((select auth.uid()) = buyer_id) OR ((select auth.uid()) = seller_id));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK ((((select auth.uid()) = buyer_id) OR ((select auth.uid()) = seller_id)));

-- --- Messages Policies ---
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
  )
);
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id AND conversations.seller_id = (select auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id AND conversations.buyer_id = (select auth.uid())
  )
);

-- --- Notifications Policies ---
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);
-- Note: INSERT for notifications should be handled by SECURITY DEFINER functions called by triggers.

-- --- Stopwords Policies ---
CREATE POLICY "Stopwords are public" ON public.arabic_stopwords FOR SELECT USING (true);


-- =============================================================================
-- 5. DATABASE FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for various tables to auto-update timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 6. STORAGE BUCKETS
-- =============================================================================

-- Create listing-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create profile-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create RLS policies for listing-photos bucket
CREATE POLICY "Anyone can view listing photos" ON storage.objects FOR SELECT USING (bucket_id = 'listing-photos');
CREATE POLICY "Authenticated users can upload listing photos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own listing photos" ON storage.objects FOR UPDATE
USING (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own listing photos" ON storage.objects FOR DELETE
USING (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');

-- Create RLS policies for profile-photos bucket
CREATE POLICY "Anyone can view profile photos" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile photos" ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own profile photos" ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');
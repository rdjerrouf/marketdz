-- MarketDZ Clean Start Migration
-- Minimal working schema with no conflicts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE listing_category AS ENUM ('for_sale', 'job', 'service', 'for_rent');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'rented', 'completed', 'expired');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  city TEXT,
  wilaya TEXT,
  bio TEXT,
  avatar_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT profiles_rating_check CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT profiles_review_count_check CHECK (review_count >= 0)
);

-- Listings table
CREATE TABLE listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category listing_category NOT NULL,
  subcategory TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2),
  status listing_status DEFAULT 'active',
  location_city TEXT,
  location_wilaya TEXT,
  photos TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT listings_title_length CHECK (length(title) >= 3 AND length(title) <= 200),
  CONSTRAINT listings_price_positive CHECK (price IS NULL OR price >= 0),
  CONSTRAINT listings_views_count_positive CHECK (views_count >= 0),
  CONSTRAINT listings_favorites_count_positive CHECK (favorites_count >= 0)
);

-- Favorites table
CREATE TABLE favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, listing_id)
);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT reviews_rating_range CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(reviewer_id, reviewed_id, listing_id)
);

-- Essential indexes
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_wilaya ON profiles(wilaya);

CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_location ON listings(location_wilaya, location_city);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);

CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles viewable" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for listings
CREATE POLICY "Active listings viewable by everyone" ON listings
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view their favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- Simple, reliable user profile creation function
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at 
  BEFORE UPDATE ON listings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user rating when reviews change
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET 
        rating = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews 
            WHERE reviewed_id = COALESCE(NEW.reviewed_id, OLD.reviewed_id)
        ), 0),
        review_count = (
            SELECT COUNT(*)
            FROM reviews 
            WHERE reviewed_id = COALESCE(NEW.reviewed_id, OLD.reviewed_id)
        )
    WHERE id = COALESCE(NEW.reviewed_id, OLD.reviewed_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for rating updates
CREATE TRIGGER update_rating_on_review_insert 
  AFTER INSERT ON reviews 
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

CREATE TRIGGER update_rating_on_review_update 
  AFTER UPDATE ON reviews 
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

CREATE TRIGGER update_rating_on_review_delete 
  AFTER DELETE ON reviews 
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Function to update favorites count
CREATE OR REPLACE FUNCTION update_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE listings 
    SET favorites_count = (
        SELECT COUNT(*) 
        FROM favorites 
        WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
    )
    WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for favorites count
CREATE TRIGGER update_favorites_count_on_insert 
  AFTER INSERT ON favorites 
  FOR EACH ROW EXECUTE FUNCTION update_favorites_count();

CREATE TRIGGER update_favorites_count_on_delete 
  AFTER DELETE ON favorites 
  FOR EACH ROW EXECUTE FUNCTION update_favorites_count();
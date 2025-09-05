


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."listing_category" AS ENUM (
    'for_sale',
    'job',
    'service',
    'for_rent'
);


ALTER TYPE "public"."listing_category" OWNER TO "postgres";


CREATE TYPE "public"."listing_status" AS ENUM (
    'active',
    'sold',
    'rented',
    'completed',
    'expired'
);


ALTER TYPE "public"."listing_status" OWNER TO "postgres";


CREATE TYPE "public"."message_type" AS ENUM (
    'text',
    'image',
    'system',
    'file'
);


ALTER TYPE "public"."message_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_conversation"("buyer_uuid" "uuid", "seller_uuid" "uuid", "listing_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  conversation_uuid UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conversation_uuid
  FROM conversations
  WHERE buyer_id = buyer_uuid 
    AND seller_id = seller_uuid 
    AND (listing_id = listing_uuid OR (listing_id IS NULL AND listing_uuid IS NULL));
  
  -- If not found, create new conversation
  IF conversation_uuid IS NULL THEN
    INSERT INTO conversations (buyer_id, seller_id, listing_id)
    VALUES (buyer_uuid, seller_uuid, listing_uuid)
    RETURNING id INTO conversation_uuid;
  END IF;
  
  RETURN conversation_uuid;
END;
$$;


ALTER FUNCTION "public"."get_or_create_conversation"("buyer_uuid" "uuid", "seller_uuid" "uuid", "listing_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  full_name text;
  name_parts text[];
  first_name text;
  last_name text;
BEGIN
  -- Extract name from raw_user_meta_data
  full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'display_name'
  );
  
  -- If we have a full name, split it into first and last
  IF full_name IS NOT NULL AND full_name != '' THEN
    name_parts := string_to_array(trim(full_name), ' ');
    first_name := name_parts[1];
    
    -- If there are multiple parts, last name is everything after the first
    IF array_length(name_parts, 1) > 1 THEN
      last_name := array_to_string(name_parts[2:], ' ');
    END IF;
  END IF;
  
  -- Fall back to individual first_name and last_name fields if full name not available
  IF first_name IS NULL OR first_name = '' THEN
    first_name := COALESCE(
      new.raw_user_meta_data->>'first_name',
      split_part(new.email, '@', 1) -- Use email prefix as fallback
    );
  END IF;
  
  IF last_name IS NULL OR last_name = '' THEN
    last_name := new.raw_user_meta_data->>'last_name';
  END IF;
  
  -- Insert the profile with proper name handling
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    new.id, 
    COALESCE(first_name, 'User'),
    COALESCE(last_name, ''),
    now(),
    now()
  );
  
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_messages_as_read"("conversation_uuid" "uuid", "user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark unread messages as read
  UPDATE messages 
  SET read_at = NOW()
  WHERE conversation_id = conversation_uuid
    AND sender_id != user_uuid
    AND read_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Reset unread count for this user
  UPDATE conversations
  SET 
    buyer_unread_count = CASE 
      WHEN buyer_id = user_uuid THEN 0 
      ELSE buyer_unread_count 
    END,
    seller_unread_count = CASE 
      WHEN seller_id = user_uuid THEN 0 
      ELSE seller_unread_count 
    END,
    updated_at = NOW()
  WHERE id = conversation_uuid
    AND (buyer_id = user_uuid OR seller_id = user_uuid);
  
  RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."mark_messages_as_read"("conversation_uuid" "uuid", "user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_listings"("search_query" "text" DEFAULT NULL::"text", "category_filter" "text" DEFAULT NULL::"text", "wilaya_filter" "text" DEFAULT NULL::"text", "city_filter" "text" DEFAULT NULL::"text", "min_price" numeric DEFAULT NULL::numeric, "max_price" numeric DEFAULT NULL::numeric, "sort_by" "text" DEFAULT 'relevance'::"text", "page_offset" integer DEFAULT 0, "page_limit" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "price" numeric, "category" "text", "photos" "text"[], "created_at" timestamp with time zone, "status" "text", "user_id" "uuid", "wilaya" "text", "city" "text", "search_rank" real)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.description,
    l.price,
    l.category::text,  -- Cast enum to text
    l.photos,
    l.created_at,
    l.status::text,    -- Cast enum to text
    l.user_id,
    l.location_wilaya as wilaya,  -- Use correct column names from your schema
    l.location_city as city,      -- Use correct column names from your schema
    CASE 
      WHEN search_query IS NULL OR search_query = '' THEN 0::real
      ELSE ts_rank(
        to_tsvector('english', COALESCE(l.title, '') || ' ' || COALESCE(l.description, '')), 
        plainto_tsquery('english', search_query)
      )::real
    END as search_rank
  FROM public.listings l
  WHERE 
    l.status = 'active'
    AND (category_filter IS NULL OR l.category::text = category_filter)
    AND (wilaya_filter IS NULL OR l.location_wilaya = wilaya_filter)
    AND (city_filter IS NULL OR l.location_city = city_filter)
    AND (min_price IS NULL OR l.price >= min_price)
    AND (max_price IS NULL OR l.price <= max_price)
    AND (
      search_query IS NULL OR search_query = '' OR 
      to_tsvector('english', COALESCE(l.title, '') || ' ' || COALESCE(l.description, '')) @@ 
      plainto_tsquery('english', search_query)
    )
  ORDER BY 
    CASE WHEN sort_by = 'price_asc' THEN l.price END ASC NULLS LAST,
    CASE WHEN sort_by = 'price_desc' THEN l.price END DESC NULLS LAST,
    CASE WHEN sort_by = 'date_desc' THEN l.created_at END DESC,
    CASE WHEN sort_by = 'date_asc' THEN l.created_at END ASC,
    CASE 
      WHEN sort_by = 'relevance' AND search_query IS NOT NULL AND search_query != '' 
      THEN ts_rank(
        to_tsvector('english', COALESCE(l.title, '') || ' ' || COALESCE(l.description, '')), 
        plainto_tsquery('english', search_query)
      )
    END DESC,
    l.created_at DESC  -- Default fallback sort
  LIMIT page_limit OFFSET page_offset;
END;
$$;


ALTER FUNCTION "public"."search_listings"("search_query" "text", "category_filter" "text", "wilaya_filter" "text", "city_filter" "text", "min_price" numeric, "max_price" numeric, "sort_by" "text", "page_offset" integer, "page_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update the conversation with last message info
  UPDATE conversations 
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW(),
    -- Increment unread count for the recipient
    buyer_unread_count = CASE 
      WHEN NEW.sender_id != conversations.buyer_id 
      THEN conversations.buyer_unread_count + 1
      ELSE conversations.buyer_unread_count
    END,
    seller_unread_count = CASE 
      WHEN NEW.sender_id != conversations.seller_id 
      THEN conversations.seller_unread_count + 1
      ELSE conversations.seller_unread_count
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_favorites_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_favorites_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the reviewed user's rating and review count
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
$$;


ALTER FUNCTION "public"."update_user_rating"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."blocked_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blocked_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid",
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_message_id" "uuid",
    "buyer_unread_count" integer DEFAULT 0,
    "seller_unread_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "conversations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "public"."listing_category" NOT NULL,
    "subcategory" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "price" numeric(12,2),
    "status" "public"."listing_status" DEFAULT 'active'::"public"."listing_status",
    "location_city" "text",
    "location_wilaya" "text",
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "views_count" integer DEFAULT 0,
    "favorites_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "location" "jsonb",
    CONSTRAINT "listings_favorites_count_check" CHECK (("favorites_count" >= 0)),
    CONSTRAINT "listings_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "listings_title_check" CHECK ((("length"("title") >= 3) AND ("length"("title") <= 200))),
    CONSTRAINT "listings_views_count_check" CHECK (("views_count" >= 0))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "message_type" "public"."message_type" DEFAULT 'text'::"public"."message_type",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "edited_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "non_empty_content" CHECK ((("message_type" <> 'text'::"public"."message_type") OR (("message_type" = 'text'::"public"."message_type") AND ("length"(TRIM(BOTH FROM "content")) > 0))))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "bio" "text",
    "phone" "text",
    "avatar_url" "text",
    "city" "text",
    "wilaya" "text",
    "rating" numeric(3,2) DEFAULT 0.0,
    "review_count" integer DEFAULT 0,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_rating_check" CHECK ((("rating" >= (0)::numeric) AND ("rating" <= (5)::numeric))),
    CONSTRAINT "profiles_review_count_check" CHECK (("review_count" >= 0))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewed_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


ALTER TABLE ONLY "public"."blocked_users"
    ADD CONSTRAINT "blocked_users_blocker_id_blocked_id_key" UNIQUE ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."blocked_users"
    ADD CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_listing_id_buyer_id_seller_id_key" UNIQUE ("listing_id", "buyer_id", "seller_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_listing_id_key" UNIQUE ("user_id", "listing_id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_endpoint_key" UNIQUE ("user_id", "endpoint");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_reviewed_id_listing_id_key" UNIQUE ("reviewer_id", "reviewed_id", "listing_id");



CREATE INDEX "conversations_buyer_id_idx" ON "public"."conversations" USING "btree" ("buyer_id");



CREATE INDEX "conversations_last_message_at_idx" ON "public"."conversations" USING "btree" ("last_message_at" DESC);



CREATE INDEX "conversations_listing_id_idx" ON "public"."conversations" USING "btree" ("listing_id");



CREATE INDEX "conversations_seller_id_idx" ON "public"."conversations" USING "btree" ("seller_id");



CREATE INDEX "idx_conversations_buyer_id" ON "public"."conversations" USING "btree" ("buyer_id");



CREATE INDEX "idx_conversations_seller_id" ON "public"."conversations" USING "btree" ("seller_id");



CREATE INDEX "idx_favorites_listing_id" ON "public"."favorites" USING "btree" ("listing_id");



CREATE INDEX "idx_favorites_user_id" ON "public"."favorites" USING "btree" ("user_id");



CREATE INDEX "idx_listings_category" ON "public"."listings" USING "btree" ("category");



CREATE INDEX "idx_listings_created_at" ON "public"."listings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_listings_price" ON "public"."listings" USING "btree" ("price");



CREATE INDEX "idx_listings_status" ON "public"."listings" USING "btree" ("status");



CREATE INDEX "idx_listings_user_id" ON "public"."listings" USING "btree" ("user_id");



CREATE INDEX "idx_listings_wilaya" ON "public"."listings" USING "btree" ("location_wilaya");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profiles_wilaya" ON "public"."profiles" USING "btree" ("wilaya");



CREATE INDEX "idx_reviews_reviewed_id" ON "public"."reviews" USING "btree" ("reviewed_id");



CREATE INDEX "messages_conversation_created_idx" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "messages_conversation_id_idx" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "messages_created_at_idx" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "messages_sender_id_idx" ON "public"."messages" USING "btree" ("sender_id");



CREATE OR REPLACE TRIGGER "update_conversation_on_new_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message"();



CREATE OR REPLACE TRIGGER "update_favorites_count_on_delete" AFTER DELETE ON "public"."favorites" FOR EACH ROW EXECUTE FUNCTION "public"."update_favorites_count"();



CREATE OR REPLACE TRIGGER "update_favorites_count_on_insert" AFTER INSERT ON "public"."favorites" FOR EACH ROW EXECUTE FUNCTION "public"."update_favorites_count"();



CREATE OR REPLACE TRIGGER "update_listings_updated_at" BEFORE UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rating_on_review_delete" AFTER DELETE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_rating"();



CREATE OR REPLACE TRIGGER "update_rating_on_review_insert" AFTER INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_rating"();



CREATE OR REPLACE TRIGGER "update_rating_on_review_update" AFTER UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_rating"();



ALTER TABLE ONLY "public"."blocked_users"
    ADD CONSTRAINT "blocked_users_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocked_users"
    ADD CONSTRAINT "blocked_users_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewed_id_fkey" FOREIGN KEY ("reviewed_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Active listings are viewable by everyone" ON "public"."listings" FOR SELECT USING ((("status" = 'active'::"public"."listing_status") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Authenticated users can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Authenticated users can insert listings" ON "public"."listings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Reviews are viewable by everyone" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Users can add favorites" ON "public"."favorites" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can block others" ON "public"."blocked_users" FOR INSERT WITH CHECK (("auth"."uid"() = "blocker_id"));



CREATE POLICY "Users can create conversations" ON "public"."conversations" FOR INSERT WITH CHECK ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Users can create conversations where they are buyer or seller" ON "public"."conversations" FOR INSERT WITH CHECK ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Users can delete own listings" ON "public"."listings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own reviews" ON "public"."reviews" FOR DELETE USING (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can insert messages in their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."buyer_id" = "auth"."uid"()) OR ("conversations"."seller_id" = "auth"."uid"())))))));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage their own push subscriptions" ON "public"."push_subscriptions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove their own favorites" ON "public"."favorites" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can send messages in their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND (EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."buyer_id" = "auth"."uid"()) OR ("conversations"."seller_id" = "auth"."uid"())))))));



CREATE POLICY "Users can unblock others" ON "public"."blocked_users" FOR DELETE USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "Users can update conversations they are part of" ON "public"."conversations" FOR UPDATE USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Users can update own listings" ON "public"."listings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own messages" ON "public"."messages" FOR UPDATE USING (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can update their own reviews" ON "public"."reviews" FOR UPDATE USING (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can view conversations they are part of" ON "public"."conversations" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Users can view messages in their conversations" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."buyer_id" = "auth"."uid"()) OR ("conversations"."seller_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own blocked list" ON "public"."blocked_users" FOR SELECT USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "Users can view their own conversations" ON "public"."conversations" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Users can view their own favorites" ON "public"."favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."blocked_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("buyer_uuid" "uuid", "seller_uuid" "uuid", "listing_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("buyer_uuid" "uuid", "seller_uuid" "uuid", "listing_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("buyer_uuid" "uuid", "seller_uuid" "uuid", "listing_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("conversation_uuid" "uuid", "user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("conversation_uuid" "uuid", "user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("conversation_uuid" "uuid", "user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_listings"("search_query" "text", "category_filter" "text", "wilaya_filter" "text", "city_filter" "text", "min_price" numeric, "max_price" numeric, "sort_by" "text", "page_offset" integer, "page_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_listings"("search_query" "text", "category_filter" "text", "wilaya_filter" "text", "city_filter" "text", "min_price" numeric, "max_price" numeric, "sort_by" "text", "page_offset" integer, "page_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_listings"("search_query" "text", "category_filter" "text", "wilaya_filter" "text", "city_filter" "text", "min_price" numeric, "max_price" numeric, "sort_by" "text", "page_offset" integer, "page_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_favorites_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_favorites_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_favorites_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_rating"() TO "service_role";



GRANT ALL ON TABLE "public"."blocked_users" TO "anon";
GRANT ALL ON TABLE "public"."blocked_users" TO "authenticated";
GRANT ALL ON TABLE "public"."blocked_users" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;

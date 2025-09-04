import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string | null;
          buyer_id: string;
          seller_id: string;
          last_message_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          listing_id?: string | null;
          buyer_id: string;
          seller_id: string;
          last_message_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          listing_id?: string | null;
          buyer_id?: string;
          seller_id?: string;
          last_message_at?: string | null;
          created_at?: string | null;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          listing_id?: string;
          created_at?: string | null;
        };
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          category: 'for_sale' | 'job' | 'service' | 'for_rent';
          subcategory: string | null;
          title: string;
          description: string | null;
          price: number | null;
          status: 'active' | 'sold' | 'rented' | 'completed' | 'expired';
          location_city: string | null;
          location_wilaya: string | null;
          photos: string[] | null;
          metadata: Json | null;
          views_count: number | null;
          favorites_count: number | null;
          created_at: string | null;
          updated_at: string | null;
          location: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: 'for_sale' | 'job' | 'service' | 'for_rent';
          subcategory?: string | null;
          title: string;
          description?: string | null;
          price?: number | null;
          status?: 'active' | 'sold' | 'rented' | 'completed' | 'expired';
          location_city?: string | null;
          location_wilaya?: string | null;
          photos?: string[] | null;
          metadata?: Json | null;
          views_count?: number | null;
          favorites_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          location?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: 'for_sale' | 'job' | 'service' | 'for_rent';
          subcategory?: string | null;
          title?: string;
          description?: string | null;
          price?: number | null;
          status?: 'active' | 'sold' | 'rented' | 'completed' | 'expired';
          location_city?: string | null;
          location_wilaya?: string | null;
          photos?: string[] | null;
          metadata?: Json | null;
          views_count?: number | null;
          favorites_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          location?: Json | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'system';
          read_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'system';
          read_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'system';
          read_at?: string | null;
          created_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          bio: string | null;
          phone: string | null;
          avatar_url: string | null;
          city: string | null;
          wilaya: string | null;
          rating: number | null;
          review_count: number | null;
          is_verified: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          bio?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          wilaya?: string | null;
          rating?: number | null;
          review_count?: number | null;
          is_verified?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          bio?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          wilaya?: string | null;
          rating?: number | null;
          review_count?: number | null;
          is_verified?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          reviewer_id: string;
          reviewed_id: string;
          listing_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          reviewed_id: string;
          listing_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          reviewer_id?: string;
          reviewed_id?: string;
          listing_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string | null;
        };
      };
    };
    Enums: {
      listing_category: 'for_sale' | 'job' | 'service' | 'for_rent';
      listing_status: 'active' | 'sold' | 'rented' | 'completed' | 'expired';
      message_type: 'text' | 'image' | 'system';
    };
  };
};

export const supabase: SupabaseClient<Database> = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
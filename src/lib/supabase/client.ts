// Supabase client configuration
// src/lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// For client-side components
export const supabase = createClientComponentClient()

// Types for our database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          bio: string | null
          phone: string | null
          avatar_url: string | null
          city: string | null
          wilaya: string | null
          rating: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          bio?: string | null
          phone?: string | null
          avatar_url?: string | null
          city?: string | null
          wilaya?: string | null
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          bio?: string | null
          phone?: string | null
          avatar_url?: string | null
          city?: string | null
          wilaya?: string | null
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          user_id: string
          category: 'for_sale' | 'job' | 'service' | 'for_rent'
          subcategory: string | null
          title: string
          description: string | null
          price: number | null
          status: 'active' | 'sold' | 'rented' | 'completed' | 'expired'
          location_city: string | null
          location_wilaya: string | null
          photos: string[]
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: 'for_sale' | 'job' | 'service' | 'for_rent'
          subcategory?: string | null
          title: string
          description?: string | null
          price?: number | null
          status?: 'active' | 'sold' | 'rented' | 'completed' | 'expired'
          location_city?: string | null
          location_wilaya?: string | null
          photos?: string[]
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: 'for_sale' | 'job' | 'service' | 'for_rent'
          subcategory?: string | null
          title?: string
          description?: string | null
          price?: number | null
          status?: 'active' | 'sold' | 'rented' | 'completed' | 'expired'
          location_city?: string | null
          location_wilaya?: string | null
          photos?: string[]
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
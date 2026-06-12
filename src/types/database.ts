// Database types for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      listings: {
        Row: {
          id: string
          user_id: string
          category: 'for_sale' | 'job' | 'service' | 'for_rent' | 'urgent'
          subcategory: string | null
          title: string
          description: string | null
          price: number | null
          status: 'active' | 'sold' | 'rented' | 'completed' | 'expired'
          photos: string[]
          location: Json
          location_wilaya: string | null
          location_city: string | null
          metadata: Json
          condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor' | null
          available_from: string | null
          available_to: string | null
          rental_period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          salary_min: number | null
          salary_max: number | null
          salary_amount: number | null
          salary_type: string | null
          job_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null
          company_name: string | null
          urgent_type: 'blood_donation' | 'medicine_needed' | 'food_assistance' | 'medical_equipment' | 'emergency_housing' | null
          urgent_expires_at: string | null
          urgent_contact_preference: 'phone' | 'whatsapp' | 'both' | null
          is_hot_deal: boolean
          hot_deal_expires_at: string | null
          search_vector_ar: unknown | null
          search_vector_fr: unknown | null
          // Vehicle dedicated columns
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vehicle_mileage: number | null
          vehicle_transmission: 'manual' | 'automatic' | 'semi-automatic' | null
          vehicle_fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | null
          vehicle_body_type: string | null
          // Generic subcategory details
          listing_details: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: 'for_sale' | 'job' | 'service' | 'for_rent' | 'urgent'
          subcategory?: string | null
          title: string
          description?: string | null
          price?: number | null
          status?: 'active' | 'sold' | 'rented' | 'completed' | 'expired'
          photos?: string[]
          location?: Json
          location_wilaya?: string | null
          location_city?: string | null
          metadata?: Json
          condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor' | null
          available_from?: string | null
          available_to?: string | null
          rental_period?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          salary_min?: number | null
          salary_max?: number | null
          salary_amount?: number | null
          salary_type?: string | null
          job_type?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null
          company_name?: string | null
          urgent_type?: 'blood_donation' | 'medicine_needed' | 'food_assistance' | 'medical_equipment' | 'emergency_housing' | null
          urgent_expires_at?: string | null
          urgent_contact_preference?: 'phone' | 'whatsapp' | 'both' | null
          is_hot_deal?: boolean
          hot_deal_expires_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vehicle_mileage?: number | null
          vehicle_transmission?: 'manual' | 'automatic' | 'semi-automatic' | null
          vehicle_fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | null
          vehicle_body_type?: string | null
          listing_details?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: 'for_sale' | 'job' | 'service' | 'for_rent' | 'urgent'
          subcategory?: string | null
          title?: string
          description?: string | null
          price?: number | null
          status?: 'active' | 'sold' | 'rented' | 'completed' | 'expired'
          photos?: string[]
          location?: Json
          location_wilaya?: string | null
          location_city?: string | null
          metadata?: Json
          condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor' | null
          available_from?: string | null
          available_to?: string | null
          rental_period?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          salary_min?: number | null
          salary_max?: number | null
          salary_amount?: number | null
          salary_type?: string | null
          job_type?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null
          company_name?: string | null
          urgent_type?: 'blood_donation' | 'medicine_needed' | 'food_assistance' | 'medical_equipment' | 'emergency_housing' | null
          urgent_expires_at?: string | null
          urgent_contact_preference?: 'phone' | 'whatsapp' | 'both' | null
          is_hot_deal?: boolean
          hot_deal_expires_at?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vehicle_mileage?: number | null
          vehicle_transmission?: 'manual' | 'automatic' | 'semi-automatic' | null
          vehicle_fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | null
          vehicle_body_type?: string | null
          listing_details?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          listing_id: string | null
          last_message_id: string | null
          last_message_at: string
          buyer_unread_count: number
          seller_unread_count: number
          status: 'active' | 'archived' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          listing_id?: string | null
          last_message_id?: string | null
          last_message_at?: string
          buyer_unread_count?: number
          seller_unread_count?: number
          status?: 'active' | 'archived' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          listing_id?: string | null
          last_message_id?: string | null
          last_message_at?: string
          buyer_unread_count?: number
          seller_unread_count?: number
          status?: 'active' | 'archived' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'file' | 'system'
          metadata: Json
          read_at: string | null
          edited_at: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          metadata?: Json
          read_at?: string | null
          edited_at?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          metadata?: Json
          read_at?: string | null
          edited_at?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          reviewed_id: string
          listing_id: string | null
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          reviewed_id: string
          listing_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          reviewed_id?: string
          listing_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'review' | 'favorite' | 'message' | 'system'
          title: string
          message: string
          data: Json | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'review' | 'favorite' | 'message' | 'system'
          title: string
          message: string
          data?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'review' | 'favorite' | 'message' | 'system'
          title?: string
          message?: string
          data?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      search_zero_results: {
        Row: {
          id: number
          query: string
          locale: string | null
          filters: Json | null
          created_at: string
        }
        Insert: {
          query: string
          locale?: string | null
          filters?: Json | null
          created_at?: string
        }
        Update: {
          query?: string
          locale?: string | null
          filters?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      search_lexicon: {
        Row: {
          id: number
          terms: string[]
          category: string | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          terms: string[]
          category?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          terms?: string[]
          category?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_messages_read: {
        Args: {
          conversation_uuid: string
        }
        Returns: undefined
      }
      mark_notification_read: {
        Args: {
          notification_id: string
        }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: Record<string, never>
        Returns: undefined
      }
      search_listings_v2: {
        Args: {
          p_query?: string | null
          p_category?: string | null
          p_subcategory?: string | null
          p_wilaya?: string | null
          p_city?: string | null
          p_min_price?: number | null
          p_max_price?: number | null
          p_available_from?: string | null
          p_available_to?: string | null
          p_rental_period?: string | null
          p_min_salary?: number | null
          p_max_salary?: number | null
          p_job_type?: string | null
          p_company_name?: string | null
          p_condition?: string | null
          p_vehicle_make?: string | null
          p_vehicle_transmission?: string | null
          p_vehicle_fuel_type?: string | null
          p_vehicle_year_min?: number | null
          p_vehicle_year_max?: number | null
          p_vehicle_mileage_max?: number | null
          p_details?: Json | null
          p_details_text?: Json | null
          p_sort?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          price: number | null
          category: string
          subcategory: string | null
          created_at: string
          status: string
          user_id: string
          location_wilaya: string | null
          location_city: string | null
          photos: string[] | null
          condition: string | null
          available_from: string | null
          available_to: string | null
          rental_period: string | null
          salary_min: number | null
          salary_max: number | null
          job_type: string | null
          company_name: string | null
          favorites_count: number | null
          views_count: number | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vehicle_mileage: number | null
          vehicle_transmission: string | null
          vehicle_fuel_type: string | null
          vehicle_body_type: string | null
          listing_details: Json | null
          rank: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

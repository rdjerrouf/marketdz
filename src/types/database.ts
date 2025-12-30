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
          metadata: Json
          urgent_type: 'blood_donation' | 'medicine_needed' | 'food_assistance' | 'medical_equipment' | 'emergency_housing' | null
          urgent_expires_at: string | null
          urgent_contact_preference: 'phone' | 'whatsapp' | 'both' | null
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
          metadata?: Json
          urgent_type?: 'blood_donation' | 'medicine_needed' | 'food_assistance' | 'medical_equipment' | 'emergency_housing' | null
          urgent_expires_at?: string | null
          urgent_contact_preference?: 'phone' | 'whatsapp' | 'both' | null
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
          metadata?: Json
          urgent_type?: 'blood_donation' | 'medicine_needed' | 'food_assistance' | 'medical_equipment' | 'emergency_housing' | null
          urgent_expires_at?: string | null
          urgent_contact_preference?: 'phone' | 'whatsapp' | 'both' | null
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

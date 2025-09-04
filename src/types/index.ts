// TypeScript type definitions
// src/types/index.ts

// Rate limiting types
export interface RateLimit {
  id: string
  key: string
  identifier: string
  count: number
  window_start: string
  window_end: string
  created_at: string
  updated_at: string
}

// User related types
export interface User {
  id: string
  email: string
  created_at: string
}

export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  bio?: string | null
  phone?: string | null
  avatar_url?: string | null
  city?: string | null
  wilaya?: string | null
  rating: number
  review_count: number
  created_at: string
  updated_at: string
}

export interface CreateProfileData {
  first_name: string
  last_name: string
  bio?: string
  phone?: string
  city?: string
  wilaya?: string
}

// Listing related types
export type ListingStatus = 'active' | 'sold' | 'rented' | 'completed' | 'expired'
export type ListingCategory = 'for_sale' | 'job' | 'service' | 'for_rent'

export interface BaseListing {
  id: string
  user_id: string
  category: ListingCategory
  subcategory?: string | null
  title: string
  description: string | null
  price: number | null
  status: ListingStatus
  location_city?: string
  location_wilaya?: string
  photos: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Database compatible types
export type Listing = BaseListing

export interface ListingWithProfile extends BaseListing {
  profile: UserProfile
}

// Specific listing types based on category
export interface ForSaleListing extends BaseListing {
  category: 'for_sale'
  metadata: {
    condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
    brand?: string
    model?: string
    year?: number
  }
}

export interface JobListing extends BaseListing {
  category: 'job'
  metadata: {
    company_name?: string
    job_type?: 'full_time' | 'part_time' | 'contract' | 'internship'
    salary_range?: {
      min?: number
      max?: number
      currency: 'DZD'
    }
    requirements?: string[]
    benefits?: string[]
    application_deadline?: string
    contact_email?: string
  }
}

export interface ServiceListing extends BaseListing {
  category: 'service'
  metadata: {
    pricing_model?: 'hourly' | 'fixed' | 'negotiable'
    experience_years?: number
    availability?: string[]
    service_area?: string[]
    qualifications?: string[]
  }
}

export interface RentalListing extends BaseListing {
  category: 'for_rent'
  metadata: {
    rental_period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    deposit_required?: number
    utilities_included?: boolean
    furnished?: boolean
    property_type?: string
    size?: {
      value: number
      unit: 'm²' | 'rooms'
    }
  }
}

// Form data types for creating listings
export interface CreateListingData {
  category: ListingCategory
  subcategory?: string
  title: string
  description?: string
  price?: number
  location_city?: string
  location_wilaya?: string
  photos?: File[]
  metadata?: Record<string, unknown>
}

// Chat related types
export interface Conversation {
  id: string
  listing_id?: string
  buyer_id: string
  seller_id: string
  last_message_at: string
  created_at: string
  listing?: BaseListing
  buyer?: UserProfile
  seller?: UserProfile
}

export type MessageType = 'text' | 'image' | 'system'

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: MessageType
  read_at?: string
  created_at: string
  sender?: UserProfile
}

export interface CreateMessageData {
  conversation_id: string
  content: string
  message_type?: MessageType
}

// Search and filtering types
export interface SearchFilters {
  query?: string
  category?: ListingCategory
  subcategory?: string
  wilaya?: string
  city?: string
  price_min?: number
  price_max?: number
  sort_by?: 'created_at' | 'price' | 'title'
  sort_order?: 'asc' | 'desc'
  status?: ListingStatus
}

export interface SearchResults {
  listings: ListingWithProfile[]
  total_count: number
  has_more: boolean
  next_cursor?: string
}

// Review and rating types
export interface Review {
  id: string
  reviewer_id: string
  reviewed_id: string
  listing_id?: string
  rating: number
  comment?: string
  created_at: string
  reviewer?: UserProfile
  listing?: BaseListing
}

export interface CreateReviewData {
  reviewed_id: string
  listing_id?: string
  rating: number
  comment?: string
}

// Favorites types
export interface Favorite {
  id: string
  user_id: string
  listing_id: string
  created_at: string
  listing?: ListingWithProfile
}

// Notification types
export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface NotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  has_more: boolean
  next_cursor?: string
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined
}

export interface ValidationResult {
  isValid: boolean
  errors: FormErrors
}

// Location types (from Algeria constants)
export interface AlgeriaLocation {
  wilaya: string
  city?: string
}

// Component prop types
export interface ListingCardProps {
  listing: ListingWithProfile
  onFavoriteToggle?: (listingId: string) => void
  showFavoriteButton?: boolean
  className?: string
}

export interface UserAvatarProps {
  user: UserProfile
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Hook return types
export interface UseListingsReturn {
  listings: ListingWithProfile[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

export interface UseAuthReturn {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, profileData: CreateProfileData) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<CreateProfileData>) => Promise<void>
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Constants
export const LISTING_STATUSES = ['active', 'sold', 'rented', 'completed', 'expired'] as const
export const MESSAGE_TYPES = ['text', 'image', 'system'] as const
export const RATING_VALUES = [1, 2, 3, 4, 5] as const

// Export utility type guards
export function isForSaleListing(listing: BaseListing): listing is ForSaleListing {
  return listing.category === 'for_sale'
}

export function isJobListing(listing: BaseListing): listing is JobListing {
  return listing.category === 'job'
}

export function isServiceListing(listing: BaseListing): listing is ServiceListing {
  return listing.category === 'service'
}

export function isRentalListing(listing: BaseListing): listing is RentalListing {
  return listing.category === 'for_rent'
}
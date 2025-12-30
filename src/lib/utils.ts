/**
 * Utility Functions - Common Helpers
 *
 * Includes:
 * - Tailwind class merging
 * - Price/date formatting (Algeria-specific)
 * - Phone number normalization (WhatsApp-compatible)
 * - Validation helpers
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes with proper precedence
 * Handles conflicts (e.g., "px-2 px-4" → "px-4")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for Algeria (DZD - Algerian Dinar)
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,  // No cents for DZD
    maximumFractionDigits: 0,
  }).format(price)
}

// Format price with rental period for rental listings
export function formatPriceWithPeriod(price: number | null, category: string, rentalPeriod?: string | null): string {
  if (!price) {
    return category === 'for_rent' ? 'Contact for price' : 'Price negotiable'
  }

  const formattedPrice = formatPrice(price)

  // Add rental period for rental listings
  if (category === 'for_rent' && rentalPeriod) {
    const periodMap: Record<string, string> = {
      'daily': '/day',
      'weekly': '/week',
      'monthly': '/month',
      'yearly': '/year'
    }
    const periodText = periodMap[rentalPeriod] || ''
    return `${formattedPrice}${periodText}`
  }

  return formattedPrice
}

// Format date for display
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate Algerian phone number format
 * Accepts: +213 5XX XXX XXX or 05XX XXX XXX
 * Mobile prefixes: 5, 6, 7 (Djezzy, Mobilis, Ooredoo)
 */
export function isValidAlgerianPhone(phone: string): boolean {
  const phoneRegex = /^(\+213|0)[567]\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Normalize phone to international format for WhatsApp
 * Converts: 0551234567 → +213551234567
 * Why: WhatsApp requires +country_code format
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''

  const cleaned = phone.replace(/\D/g, '')  // Remove non-digits

  if (cleaned.startsWith('213')) {
    // Already international format
    return `+${cleaned}`
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Convert local to international (remove leading 0, add +213)
    const localNumber = cleaned.substring(1)
    return `+213${localNumber}`
  }

  // Return as-is if format not recognized
  return phone
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('213')) {
    // International format
    const number = cleaned.substring(3)
    return `+213 ${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7)}`
  } else if (cleaned.startsWith('0')) {
    // Local format
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8)}`
  }

  return phone
}

/**
 * Generate WhatsApp "Click to Chat" link
 * Opens WhatsApp with pre-filled message to normalized phone number
 * Format: https://wa.me/213551234567?text=Hello
 */
export function generateWhatsAppLink(phone: string, message?: string): string {
  if (!phone) return ''

  const normalizedPhone = normalizePhoneNumber(phone)
  const cleanPhone = normalizedPhone.replace(/\D/g, '') // Remove + for wa.me

  const encodedMessage = message ? encodeURIComponent(message) : ''
  const messageParam = message ? `?text=${encodedMessage}` : ''

  return `https://wa.me/${cleanPhone}${messageParam}`
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

// Fix photo URLs to use the correct Supabase URL for browser access
export function fixPhotoUrl(url: string | undefined | null): string {
  // Use inline SVG placeholder to avoid 404 errors
  if (!url) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial,sans-serif" font-size="18" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E'

  // If already a full URL, just fix Docker URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace('http://127.0.0.1:54321', 'http://localhost:54321')
  }

  // If it's a storage path, convert to public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  return `${supabaseUrl}/storage/v1/object/public/listing-photos/${url}`
}
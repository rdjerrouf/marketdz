/**
 * Browser-Side Supabase Client (Singleton Pattern)
 *
 * CRITICAL: Only ONE instance exists across the entire app
 * Auth state changes are handled in AuthContext.tsx (prevents duplicate listeners)
 */

import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance - only create once globally to prevent "Multiple GoTrueClient instances" warning
let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Get or create the Supabase client instance
 * Uses lazy initialization - creates client only when first accessed
 */
function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client instance created')
  }
  return supabaseInstance
}

// Export the singleton instance for use throughout the app
// IMPORTANT: Auth state listener is in AuthContext.tsx, not here
export const supabase = getSupabaseClient()

/**
 * Global error handler for auth errors
 * Intercepts refresh token errors and redirects to signin (better UX than showing errors)
 */
const originalError = console.error
console.error = (...args) => {
  const errorMessage = args.join(' ')

  // Handle expired/invalid token errors silently
  if (errorMessage.includes('Invalid Refresh Token') ||
      errorMessage.includes('Refresh Token Not Found') ||
      errorMessage.includes('AuthApiError') ||
      (errorMessage.includes('AuthError') && errorMessage.includes('refresh'))) {

    console.log('🔄 Auth error detected - handling silently')

    // Sign out and redirect to signin (only if not already on auth pages)
    supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (!currentPath.includes('/signin') && !currentPath.includes('/signup')) {
        setTimeout(() => {
          window.location.href = '/signin?message=Session expired. Please sign in again.'
        }, 100)
      }
    }

    return // Don't log to reduce console noise
  }

  // Log all other errors normally
  originalError.apply(console, args)
}

export type { Database }

import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance - only create once globally
let supabaseInstance: SupabaseClient<Database> | null = null

// Get or create the Supabase client instance
function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client instance created')
  }
  return supabaseInstance
}

// Export the singleton instance
// Note: Auth state changes are handled in AuthContext.tsx to avoid duplicate listeners
export const supabase = getSupabaseClient()

// Enhanced global error handler for auth errors
const originalError = console.error
console.error = (...args) => {
  const errorMessage = args.join(' ')

  // Handle specific Supabase auth errors silently
  if (errorMessage.includes('Invalid Refresh Token') ||
      errorMessage.includes('Refresh Token Not Found') ||
      errorMessage.includes('AuthApiError') ||
      (errorMessage.includes('AuthError') && errorMessage.includes('refresh'))) {

    console.log('🔄 Auth error detected - handling silently')

    // Handle auth error directly by signing out
    supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (!currentPath.includes('/signin') && !currentPath.includes('/signup')) {
        setTimeout(() => {
          window.location.href = '/signin?message=Session expired. Please sign in again.'
        }, 100)
      }
    }

    return // Don't log the error to console to reduce noise
  }

  // Call original console.error for other errors
  originalError.apply(console, args)
}

export type { Database }

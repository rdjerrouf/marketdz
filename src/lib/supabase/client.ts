/**
 * Browser-Side Supabase Client (Singleton Pattern)
 *
 * CRITICAL: Only ONE instance exists across the entire app
 * Auth state changes are handled in AuthContext.tsx (prevents duplicate listeners)
 */

import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { locales } from '@/i18n/config'

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

// Export a lazy proxy so the client is only created on first property access,
// not at module evaluation time. This prevents @supabase/ssr from throwing
// during Next.js static pre-rendering when NEXT_PUBLIC_* vars aren't set yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<Database> = new Proxy({} as any, {
  get(_: unknown, prop: string | symbol) {
    return Reflect.get(getSupabaseClient(), prop)
  }
})

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
        // Keep the locale prefix (/ar, /en, /fr) so the user lands on signin in their language
        const firstSegment = currentPath.split('/')[1]
        const localePrefix = (locales as readonly string[]).includes(firstSegment) ? `/${firstSegment}` : ''
        setTimeout(() => {
          window.location.href = `${localePrefix}/signin?message=Session expired. Please sign in again.`
        }, 100)
      }
    }

    return // Don't log to reduce console noise
  }

  // Log all other errors normally
  originalError.apply(console, args)
}

export type { Database }

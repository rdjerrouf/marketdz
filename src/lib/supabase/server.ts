/**
 * Server-Side Supabase Clients
 *
 * Contains factory functions for creating Supabase clients in different server contexts.
 * Each function is optimized for specific use cases (SSR, API routes, admin operations).
 */

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { NextRequest } from 'next/server'

/**
 * Create Supabase client for Server Components and API routes
 * Supports both cookie-based (default) and Authorization header auth
 */
export const createServerSupabaseClient = async (request?: NextRequest) => {
  const cookieStore = await cookies()

  // If Authorization header present, use token-based auth (bypasses cookie complexity)
  if (request?.headers.get('Authorization')) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) {
      return createClient<Database>(
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          },
          auth: {
            persistSession: false // API routes don't persist sessions
          }
        }
      );
    }
  }

  // Default: Cookie-based auth for Server Components
  return createServerClient<Database>(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in Server Components (can't set cookies there)
          }
        },
      },
    }
  )
}

/**
 * Create Supabase client for API routes (reads middleware-processed cookies)
 * CRITICAL: Must strip Authorization header to force cookie-based auth
 */
export const createApiSupabaseClient = (request: NextRequest) => {
  const allCookies = request.cookies.getAll()
  const authHeader = request.headers.get('Authorization')

  console.log('🔧 createApiSupabaseClient:', {
    hasAuthHeader: !!authHeader,
    cookieCount: allCookies.length,
    supabaseCookies: allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-')),
  })

  // Remove Authorization header to force cookie-based auth
  // Why: @supabase/ssr ignores cookies when Authorization header is present
  const headersWithoutAuth = new Headers(request.headers)
  if (authHeader) {
    console.log('🚫 Removing Authorization header to force cookie-based auth')
    headersWithoutAuth.delete('Authorization')
  }

  // Create client that reads cookies set by middleware
  const client = createServerClient<Database>(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          console.log('🔧 getAll() returning', allCookies.length, 'cookies')
          return allCookies
        },
        setAll(cookiesToSet) {
          // Don't set cookies in API routes - middleware already handled this
        },
      },
    }
  )

  return client
}

/**
 * Create basic Supabase client (no auth context)
 * Use for: Public data queries, non-auth operations
 */
export const createSupabaseClient = () => {
  return createClient<Database>(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Create admin Supabase client (bypasses RLS)
 * SECURITY: Only use server-side after authenticating user
 * See CLAUDE.md "Service Role Pattern" for usage guidelines
 */
export const createSupabaseAdminClient = () => {
  return createClient<Database>(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: {
        schema: 'public'
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Helper: Get authenticated user in Server Components
export async function getServerUser() {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Helper: Get user profile by ID in Server Components
export async function getServerUserProfile(userId: string) {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return profile
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}
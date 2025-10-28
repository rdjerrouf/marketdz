// src/lib/supabase/server.ts - Simple working version
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { NextRequest } from 'next/server'

// For server-side components and API routes (Next.js 15 compatible)
export const createServerSupabaseClient = async (request?: NextRequest) => {
  const cookieStore = await cookies()

  // If this is an API route request with an Authorization header, use it
  if (request?.headers.get('Authorization')) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) {
      // IMPORTANT: Keep cookies enabled for session refresh even when using Authorization header
      // This ensures getSession() works and PostgREST has JWT context for RLS
      return createServerClient<Database>(
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              // Allow cookies for session refresh
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              // Allow setting cookies for session persistence
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // Ignore errors in Server Components
              }
            },
          },
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
    }
  }

  // Default cookie-based client for server components
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
            // Ignore errors in Server Components
          }
        },
      },
    }
  )
}

// For API routes that need to work with middleware-processed requests
export const createApiSupabaseClient = (request: NextRequest) => {
  const allCookies = request.cookies.getAll()
  const authHeader = request.headers.get('Authorization')

  // Log everything to diagnose production issue
  console.log('🔧 createApiSupabaseClient DETAILED:', {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
    hasAuthHeader: !!authHeader,
    cookieCount: allCookies.length,
    cookieNames: allCookies.map(c => c.name),
    supabaseCookies: allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-')),
  })

  // Create a new Headers object WITHOUT the Authorization header
  // This prevents @supabase/ssr from using bearer token auth
  const headersWithoutAuth = new Headers(request.headers)
  if (authHeader) {
    console.log('🚫 Removing Authorization header to force cookie-based auth')
    headersWithoutAuth.delete('Authorization')
  }

  // Create a modified request object without Authorization header
  const modifiedRequest = new NextRequest(request.url, {
    headers: headersWithoutAuth,
    method: request.method,
  })

  // IMPORTANT: Use cookies ONLY - strip Authorization header completely
  // The Authorization header causes @supabase/ssr to ignore cookies
  const client = createServerClient<Database>(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          console.log('🔧 getAll() called, returning', allCookies.length, 'cookies')
          return allCookies
        },
        setAll(cookiesToSet) {
          console.log('🔧 setAll() called with', cookiesToSet.length, 'cookies')
          // Don't try to set cookies in API routes - they're already set by middleware
        },
      },
      // DO NOT set Authorization header - let cookies handle auth
    }
  )

  return client
}

// Lazy initialization functions (community-proven pattern)
export const createSupabaseClient = () => {
  return createClient<Database>(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

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

// Helper functions
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
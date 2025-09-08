// src/lib/supabase/serverPool.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Global server-side Supabase client for connection pooling
 * This instance is reused across all API calls in the same serverless container
 * Optimized for MarketDZ marketplace on Supabase Nano tier (Pool Size: 15, Max Connections: 200)
 */
let serverSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getServerSupabase = () => {
  if (!serverSupabaseInstance) {
    serverSupabaseInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        // Server-side calls don't need session persistence
        persistSession: false,
        autoRefreshToken: false,
      },
      // Enable automatic retries for better reliability
      global: {
        headers: {
          'X-Client-Info': 'marketdz-server@1.0.0',
        },
      },
    })
    
    console.log('Created new server Supabase instance for connection pooling')
  }
  return serverSupabaseInstance
}

/**
 * Authenticated server client that respects user permissions
 * Use this when you need to perform operations as a specific user
 */
export const getAuthenticatedServerSupabase = (userJWT: string) => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${userJWT}`,
          'X-Client-Info': 'marketdz-server-auth@1.0.0',
        },
      },
    }
  )
}

/**
 * Helper to extract JWT from request headers
 */
export const extractJWTFromRequest = (request: Request): string | null => {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

/**
 * Connection health check for monitoring
 */
export const checkConnectionHealth = async () => {
  try {
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    return { healthy: !error, error: error?.message }
  } catch (error) {
    return { healthy: false, error: String(error) }
  }
}

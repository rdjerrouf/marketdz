import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug logs removed - production ready

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security and reliability
    storageKey: 'marketdz-auth'
  },
  global: {
    headers: {
      'x-docker-env': 'true'
    }
  }
})

// Enhanced error handling for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔐 Auth event:', event, session ? 'with session' : 'no session')

  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ Token refreshed successfully')
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out')
    // Clear all auth-related storage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('marketdz-auth')
    }
  } else if (event === 'SIGNED_IN') {
    console.log('🎉 User signed in')
  } else if (event === 'PASSWORD_RECOVERY') {
    console.log('⚠️ Password recovery initiated')
  }
})

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

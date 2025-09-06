import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
    // Clear any cached data
    localStorage.removeItem('supabase.auth.token')
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in')
  }
})

export type { Database }

// Supabase server configuration
// src/lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from './client'

// For server-side components and API routes
export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({
    cookies,
  })
}

// For admin operations (use service role key)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to get user on server-side
export async function getServerUser() {
  const supabase = createServerSupabaseClient()
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Helper function to get user profile on server-side
export async function getServerUserProfile(userId: string) {
  const supabase = createServerSupabaseClient()
  
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
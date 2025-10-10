'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('Session error:', error.message)
          // If refresh token is invalid, clear the session
          if (error.message.includes('Invalid Refresh Token') || error.message.includes('refresh_token_not_found')) {
            await supabase.auth.signOut()
            setError('Session expired. Please sign in again.')
          } else {
            setError(error.message)
          }
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError('Failed to initialize authentication')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state change:', event)
        
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)
          setError(null)
        } else if (event === 'SIGNED_IN') {
          setSession(session)
          setUser(session?.user ?? null)
          setError(null)
        } else if (event === 'USER_UPDATED') {
          setUser(session?.user ?? null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(error.message)
      } else {
        setUser(null)
        setSession(null)
        setError(null)
      }
    } catch (err) {
      console.error('Sign out error:', err)
      setError('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    user,
    session,
    loading,
    error,
    signOut,
    clearError,
    isAuthenticated: !!user
  }
}

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      // Get initial session
      const { data: { session: initialSession }, error } = await supabase.auth.getSession()

      if (error) {
        console.log('Auth initialization error:', error.message)
        // Don't throw - just set to unauthenticated state
      }

      setSession(initialSession)
      setUser(initialSession?.user ?? null)

    } catch (error) {
      console.log('Auth initialization failed:', error)
      // Set to unauthenticated state on any error
      setSession(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initialize auth state
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔐 Auth state changed:', event, session ? 'with session' : 'no session')

        setSession(session)
        setUser(session?.user ?? null)

        // Only set loading to false after initial session check
        if (loading) {
          setLoading(false)
        }

        // Handle specific events
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in')
            break
          case 'SIGNED_OUT':
            console.log('👋 User signed out')
            setSession(null)
            setUser(null)
            // Clear all auth-related storage
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('supabase.auth.token')
              localStorage.removeItem('marketdz-auth')
            }
            break
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed successfully')
            break
          case 'PASSWORD_RECOVERY':
            console.log('🔑 Password recovery initiated')
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth, loading])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
    } catch (error) {
      console.error('Sign out failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Session refresh error:', error)
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Session refresh failed:', error)
    }
  }, [])

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
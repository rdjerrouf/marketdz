/**
 * AuthContext - Global Authentication State Management
 *
 * ARCHITECTURE: Singleton Auth Listener Pattern
 * ===============================================
 * This component is the SINGLE SOURCE OF TRUTH for authentication state in the app.
 *
 * CRITICAL PATTERN:
 * - Only ONE auth listener exists (in this component)
 * - All other components consume auth state via useAuth() hook
 * - This prevents "Multiple GoTrueClient instances" warning
 *
 * WHY THIS PATTERN:
 * - Supabase recommends only ONE auth state change listener per app
 * - Multiple listeners cause race conditions and duplicate events
 * - Singleton pattern ensures consistent auth state across all components
 *
 * USAGE:
 * 1. Wrap app with <AuthProvider> in layout.tsx
 * 2. Use useAuth() hook in any component to access auth state
 * 3. NEVER create additional auth listeners in other components
 *
 * See CLAUDE.md "Supabase Client Singleton Pattern" section for details.
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

/**
 * Auth context shape - provides auth state and actions to all components
 */
interface AuthContextType {
  user: User | null           // Current authenticated user (null if signed out)
  session: Session | null     // Current session with tokens (null if signed out)
  loading: boolean            // True during initial auth check or state changes
  signOut: () => Promise<void>      // Function to sign out user
  refreshSession: () => Promise<void> // Function to manually refresh session
}

/**
 * Create auth context with default values
 * These defaults are only used if useAuth() is called outside of AuthProvider
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

/**
 * useAuth Hook - Access authentication state from any component
 *
 * @throws Error if used outside of AuthProvider
 * @returns Current auth state (user, session, loading) and auth actions (signOut, refreshSession)
 *
 * @example
 * const { user, loading, signOut } = useAuth()
 * if (loading) return <Spinner />
 * if (!user) return <LoginPrompt />
 * return <UserProfile user={user} onSignOut={signOut} />
 */
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

/**
 * AuthProvider Component - Wraps the app to provide auth state
 *
 * RESPONSIBILITIES:
 * 1. Initialize auth state on mount
 * 2. Listen for auth changes (sign in, sign out, token refresh)
 * 3. Provide auth state and actions to all child components
 * 4. Clean up auth listener on unmount
 *
 * @param children - App components that need access to auth state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Local state for auth data
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Initialize authentication state on component mount
   *
   * WHY SEPARATE FROM useEffect:
   * - Allows us to call it from multiple places if needed
   * - Makes the initialization logic testable
   * - Wrapped in useCallback to prevent unnecessary re-renders
   *
   * FLOW:
   * 1. Call getSession() to check if user is already signed in
   * 2. Set user and session state based on response
   * 3. Handle errors gracefully (don't crash, just set to unauthenticated)
   * 4. Always set loading to false when done
   */
  const initializeAuth = useCallback(async () => {
    try {
      // Get initial session from Supabase
      // This checks if user has a valid session in localStorage/cookies
      const { data: { session: initialSession }, error } = await supabase.auth.getSession()

      if (error) {
        console.log('Auth initialization error:', error.message)
        // Don't throw - just set to unauthenticated state
        // Users can still access public pages
      }

      setSession(initialSession)
      setUser(initialSession?.user ?? null)

    } catch (error) {
      console.log('Auth initialization failed:', error)
      // Set to unauthenticated state on any error
      // Better to show login screen than crash the app
      setSession(null)
      setUser(null)
    } finally {
      // Always stop loading, even if there's an error
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initialize auth state on mount
    initializeAuth()

    // CRITICAL: Single auth listener for entire app (prevents "Multiple GoTrueClient instances" warning)
    // This listener handles: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔐 Auth state changed:', event, session ? 'with session' : 'no session')

        // Update state for all auth events
        setSession(session)
        setUser(session?.user ?? null)

        if (loading) {
          setLoading(false)
        }

        // Handle sign out specifically - clear all local auth data
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          setSession(null)
          setUser(null)
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('supabase.auth.token')
            localStorage.removeItem('marketdz-auth')
          }
        }
      }
    )

    // Cleanup: Unsubscribe when component unmounts
    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth, loading])

  // Sign out user and clear auth state
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

  // Manually refresh session (useful when tokens are about to expire)
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
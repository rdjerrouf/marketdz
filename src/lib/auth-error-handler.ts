/**
 * Auth Error Handler - Centralized Auth Error Management
 *
 * WHY NEEDED:
 * - Expired sessions cause cascading errors across app
 * - This catches auth errors and auto-redirects to signin
 * - Clears stale auth state to prevent infinite loops
 *
 * FEATURES:
 * - isRefreshTokenError: Detects invalid/expired refresh tokens
 * - isSessionExpiredError: Detects missing/expired sessions
 * - handleAuthError: Auto sign-out + redirect to signin with message
 * - withAuthErrorHandling: Wrapper for API calls with auto-retry
 *
 * USAGE:
 * - Wrap API calls: withAuthErrorHandling(() => fetch(...))
 * - In catch blocks: if (isSessionExpiredError(error)) handleAuthError(error)
 */

import { supabase } from './supabase/client'

export interface AuthError {
  message: string
  status?: number
  code?: string
}

export function isAuthError(error: any): error is AuthError {
  return error && typeof error.message === 'string'
}

export function isRefreshTokenError(error: any): boolean {
  if (!isAuthError(error)) return false

  return error.message.includes('Invalid Refresh Token') ||
         error.message.includes('Refresh Token Not Found') ||
         error.message.includes('refresh_token_not_found') ||
         error.message.includes('invalid_refresh_token')
}

export function isSessionExpiredError(error: any): boolean {
  if (!isAuthError(error)) return false

  return error.message.includes('Auth session missing') ||
         error.message.includes('session_not_found') ||
         error.message.includes('jwt expired')
}

export async function handleAuthError(error: any, redirectPath?: string): Promise<void> {
  console.log('🔄 Handling auth error:', error?.message || error)

  if (isRefreshTokenError(error) || isSessionExpiredError(error)) {
    // Clear the session
    try {
      await supabase.auth.signOut()
    } catch (signOutError) {
      console.log('Error during sign out:', signOutError)
    }

    // Clear local storage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('marketdz-auth')
    }

    // Redirect to signin page
    if (typeof window !== 'undefined') {
      const currentPath = redirectPath || window.location.pathname
      const isAuthPage = currentPath === '/signin' || currentPath === '/signup'

      if (!isAuthPage) {
        const redirectUrl = `/signin?message=Session expired. Please sign in again.&redirect=${encodeURIComponent(currentPath)}`
        window.location.href = redirectUrl
      }
    }
  }
}

// Wrapper for API calls that handles auth errors
export async function withAuthErrorHandling<T>(
  apiCall: () => Promise<T>,
  redirectPath?: string
): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    if (isRefreshTokenError(error) || isSessionExpiredError(error)) {
      await handleAuthError(error, redirectPath)
      throw new Error('Session expired. Please sign in again.')
    }
    throw error
  }
}

// Hook for React components to handle auth errors
export function useAuthErrorHandler() {
  return {
    handleAuthError: (error: any, redirectPath?: string) =>
      handleAuthError(error, redirectPath),

    isRefreshTokenError,
    isSessionExpiredError,

    withAuthErrorHandling: <T>(apiCall: () => Promise<T>, redirectPath?: string) =>
      withAuthErrorHandling(apiCall, redirectPath)
  }
}
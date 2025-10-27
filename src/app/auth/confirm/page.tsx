'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

function ConfirmEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Check for hash-based tokens (implicit flow - old Supabase format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')

        // Check for query-based token (PKCE flow - new format)
        const token_hash = searchParams?.get('token_hash')
        const type = searchParams?.get('type')

        console.log('🔐 Email confirmation:', {
          hasAccessToken: !!access_token,
          hasTokenHash: !!token_hash,
          type
        })

        // Handle implicit flow (hash-based tokens)
        if (access_token && refresh_token) {
          console.log('Using implicit flow (hash-based tokens)')

          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

          if (error) {
            console.error('Session setup error:', error)
            setStatus('error')
            setMessage(error.message || 'Failed to verify email. Please try again.')
            return
          }

          if (data.user) {
            console.log('✅ Email verified successfully (implicit flow):', data.user.id)
            setStatus('success')
            setMessage('Email verified successfully! Redirecting to sign in...')
            setTimeout(() => {
              router.push('/signin?message=Email verified! Please sign in to continue.')
            }, 2000)
          }
          return
        }

        // Handle PKCE flow (query-based token_hash)
        if (token_hash && type === 'email') {
          console.log('Using PKCE flow (token_hash)')

          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email',
          })

          if (error) {
            console.error('Email verification error:', error)
            setStatus('error')

            if (error.message.includes('expired')) {
              setMessage('Your verification link has expired. Please request a new one.')
            } else if (error.message.includes('already confirmed')) {
              setMessage('Your email is already verified! You can sign in now.')
              // Still redirect to signin for already confirmed emails
              setTimeout(() => router.push('/signin?message=Email already verified. Please sign in.'), 2000)
            } else {
              setMessage(error.message || 'Failed to verify email. Please try again.')
            }
            return
          }

          if (data.user) {
            console.log('✅ Email verified successfully (PKCE flow):', data.user.id)
            setStatus('success')
            setMessage('Email verified successfully! Redirecting to sign in...')

            // Redirect to signin after 2 seconds
            setTimeout(() => {
              router.push('/signin?message=Email verified! Please sign in to continue.')
            }, 2000)
          } else {
            setStatus('error')
            setMessage('Verification failed. Please try again.')
          }
          return
        }

        // If we get here, no valid tokens were found
        setStatus('error')
        setMessage('Invalid confirmation link. Please try again or request a new verification email.')
      } catch (err) {
        console.error('Unexpected error during email confirmation:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[#06402B] relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:4s]"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-white mb-2">
          MarketDZ
        </h1>
        <h2 className="text-center text-xl text-white/80 mb-8">
          Email Verification
        </h2>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700">Verifying your email...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Email Verified!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {message}
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                Redirecting...
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Verification Failed
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  href="/signin"
                  className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create New Account
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#06402B] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
}

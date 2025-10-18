// src/app/my-listings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import ListingManager from '@/components/listings/ListingManager'

interface User {
  id: string
  email: string
}

export default function MyListingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('👤 MyListingsPage - Checking authentication...')

        // Add timeout to prevent hanging - increased to 10 seconds
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout after 10 seconds')), 10000)
        )

        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ])

        const { data: { session }, error: sessionError } = result

        if (sessionError) {
          console.error('👤 MyListingsPage - Session error:', sessionError)
          router.push('/signin?redirect=/my-listings')
          return
        }

        if (!session) {
          console.log('👤 MyListingsPage - No session found, redirecting to signin')
          router.push('/signin?redirect=/my-listings')
          return
        }

        setUser({
          id: session.user.id,
          email: session.user.email || ''
        })

        console.log('👤 MyListingsPage - User authenticated:', {
          id: session.user.id,
          email: session.user.email
        })

      } catch (error) {
        console.error('👤 MyListingsPage - Auth check failed:', error)

        // Check if it's a timeout error specifically
        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn('👤 MyListingsPage - Session check timed out, trying fallback...')

          // Try a direct session check without timeout as fallback
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              setUser({
                id: session.user.id,
                email: session.user.email || ''
              })
              setLoading(false)
              return
            }
          } catch (fallbackError) {
            console.error('👤 MyListingsPage - Fallback auth check also failed:', fallbackError)
          }
        }

        router.push('/signin?redirect=/my-listings')
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06402B] relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        </div>
        
        <div className="relative z-10 flex items-center bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <span className="ml-3 text-white/80">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#06402B] relative overflow-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        </div>
        
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-white/80 mb-6">You need to be signed in to view your listings.</p>
          <button
            onClick={() => router.push('/signin')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06402B] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:4s]"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[
            { left: 'left-[10%]', top: 'top-[20%]', opacity: 'opacity-10' },
            { left: 'left-[25%]', top: 'top-[15%]', opacity: 'opacity-20' },
            { left: 'left-[40%]', top: 'top-[30%]', opacity: 'opacity-30' },
            { left: 'left-[60%]', top: 'top-[10%]', opacity: 'opacity-40' },
            { left: 'left-[80%]', top: 'top-[25%]', opacity: 'opacity-50' }
          ].map((particle, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-white/10 rounded-full animate-pulse ${particle.left} ${particle.top} ${particle.opacity}`}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Header with back button */}
        <div className="mb-8">
          <button
            onClick={() => {
              console.log('👤 MyListingsPage - Back button clicked')
              try {
                if (window.history.length > 1) {
                  router.back()
                } else {
                  console.log('👤 MyListingsPage - No history, going to home')
                  router.push('/')
                }
              } catch (error) {
                console.error('👤 MyListingsPage - Back navigation failed:', error)
                router.push('/')
              }
            }}
            className="flex items-center text-white/80 hover:text-white transition-colors mb-4 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Listings</h1>
                <p className="text-white/70">Manage your posted items and services</p>
              </div>
            </div>
          </div>
        </div>

        {user && <ListingManager userId={user.id} />}
      </div>
    </div>
  )
}

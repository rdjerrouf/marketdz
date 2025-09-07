// Simple test page to check authentication state
'use client'

import { useEffect, useState } from 'react'
import { getMockAuth } from '@/lib/auth/mockAuth'
import { supabase } from '@/lib/supabase/client'

export default function AuthTest() {
  const [authState, setAuthState] = useState<{
    mockAuth: any
    supabaseAuth: any
    loading: boolean
  }>({
    mockAuth: null,
    supabaseAuth: null,
    loading: true
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 AuthTest: Starting auth check')
        
        // Check mock auth
        console.log('🔍 AuthTest: Checking mock auth')
        const mockAuth = getMockAuth()
        console.log('🔍 AuthTest: Mock auth result:', mockAuth)
        
        // Check Supabase auth
        console.log('🔍 AuthTest: Checking Supabase auth')
        const { data: { user } } = await supabase.auth.getUser()
        console.log('🔍 AuthTest: Supabase auth result:', user)
        
        setAuthState({
          mockAuth,
          supabaseAuth: user,
          loading: false
        })

        console.log('🔍 AuthTest Results:', {
          mockAuth,
          supabaseAuth: user,
          localStorage: typeof window !== 'undefined' ? localStorage.getItem('mockAuth') : null
        })
      } catch (error) {
        console.error('🔍 AuthTest Error:', error)
        setAuthState({
          mockAuth: null,
          supabaseAuth: null,
          loading: false
        })
      }
    }

    checkAuth()
    
    // Add a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('🔍 AuthTest: Timeout reached, setting loading to false')
      setAuthState(prev => ({ ...prev, loading: false }))
    }, 5000)
    
    return () => clearTimeout(timeout)
  }, [])

  if (authState.loading) {
    return <div className="p-8">Loading auth test...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Mock Authentication:</h2>
        <pre className="text-sm">{JSON.stringify(authState.mockAuth, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Supabase Authentication:</h2>
        <pre className="text-sm">{JSON.stringify(authState.supabaseAuth, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">localStorage mockAuth:</h2>
        <pre className="text-sm">
          {typeof window !== 'undefined' ? localStorage.getItem('mockAuth') || 'null' : 'N/A (SSR)'}
        </pre>
      </div>
    </div>
  )
}

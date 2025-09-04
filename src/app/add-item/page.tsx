// src/app/add-item/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
}

const categories = [
  {
    id: 'for_sale',
    title: 'For Sale',
    description: 'Sell your items to buyers across Algeria',
    subtitle: 'Electronics, vehicles, furniture, clothing...',
    icon: '🛒',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'for_rent',
    title: 'For Rent',
    description: 'Rent out your properties and equipment',
    subtitle: 'Apartments, houses, rooms, offices...',
    icon: '🏠',
    color: 'from-green-400 to-green-600'
  },
  {
    id: 'job',
    title: 'Jobs',
    description: 'Post job opportunities for job seekers',
    subtitle: 'Full-time, part-time, contracts, internships...',
    icon: '💼',
    color: 'from-purple-400 to-purple-600'
  },
  {
    id: 'service',
    title: 'Services',
    description: 'Offer your professional services',
    subtitle: 'Home services, consulting, tutoring...',
    icon: '🔧',
    color: 'from-orange-400 to-orange-600'
  }
]

export default function AddItemPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin?redirect=/add-item')
        return
      }

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser({
          id: profile.id,
          email: session.user.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || ''
        })
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleCategorySelect = (categoryId: string) => {
    router.push(`/add-item/${categoryId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex">
        {/* Sidebar (same as homepage) */}
        <div className="w-64 bg-black bg-opacity-20 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center mb-8">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h1 className="text-white text-xl font-bold">MarketDZ</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex">
      {/* Sidebar Navigation (same as homepage) */}
      <div className="w-64 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="text-white text-xl font-bold">MarketDZ</h1>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </button>

            <button 
              onClick={() => router.push('/browse')}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Listings
            </button>

            <button 
              className="flex items-center w-full p-3 text-white bg-white bg-opacity-20 rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Listing
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">NEW</span>
            </button>

            <button 
              onClick={() => router.push('/browse')}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>

            <button className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorites
              <span className="ml-auto bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">0</span>
            </button>

            <button className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </button>

            <button 
              onClick={() => router.push('/profile')}
              className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>

            <div className="pt-4 border-t border-white border-opacity-20 mt-4">
              {user ? (
                <button 
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/signout', { method: 'POST' })
                      router.push('/signin')
                    } catch (error) {
                      console.error('Signout error:', error)
                      router.push('/signin')
                    }
                  }}
                  className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => router.push('/signin')}
                    className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors mb-2"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </button>
                  <button 
                    onClick={() => router.push('/signup')}
                    className="flex items-center w-full p-3 text-white rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* User Info at Bottom */}
        {user && (
          <div className="absolute bottom-4 left-4 right-4 max-w-56">
            <div className="bg-white bg-opacity-10 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">
                    {user.first_name[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-sm truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-white text-opacity-70 text-xs truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            ✨ Create Your Listing
          </h1>
          <p className="text-xl text-white text-opacity-90 mb-2">
            Choose the type of listing you'd like to create
          </p>
          <p className="text-white text-opacity-70">
            Select a category to get started
          </p>
        </div>

        {/* Category Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="group relative bg-white bg-opacity-10 backdrop-blur-sm hover:bg-opacity-20 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border border-white border-opacity-20"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative z-10 text-center">
                  <div className="text-6xl mb-4">
                    {category.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {category.title}
                  </h3>
                  
                  <p className="text-gray-700 mb-2 font-medium">
                    {category.description}
                  </p>
                  
                  <p className="text-gray-600 italic text-sm">
                    {category.subtitle}
                  </p>

                  {/* Arrow Icon */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-gray-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/')}
            className="text-white text-opacity-70 hover:text-opacity-100 transition-colors flex items-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
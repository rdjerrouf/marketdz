// src/app/add-item/[category]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import ListingForm from '@/components/listings/ListingForm'
import PWAInstallButton from '@/components/PWAInstallButton'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  city: string
  wilaya: string
}

export default function CreateListingPage() {
  const router = useRouter()
  const params = useParams()
  const category = params.category as string
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const validCategories = ['for_sale', 'job', 'service', 'for_rent']
    if (!validCategories.includes(category)) {
      router.push('/add-item')
      return
    }
  }, [category, router])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin?redirect=/add-item')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setError('Failed to load user profile')
        return
      }

      if (profile) {
        setUser({
          id: profile.id,
          email: session.user.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          city: profile.city || '',
          wilaya: profile.wilaya || ''
        })
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const getCategoryDisplay = (cat: string) => {
    const displays = {
      for_sale: { icon: '🛒', title: 'Item for Sale', description: 'Sell your items to buyers across Algeria' },
      for_rent: { icon: '🏠', title: 'Item for Rent', description: 'Rent out your properties and equipment' },
      job: { icon: '💼', title: 'Job Posting', description: 'Post job opportunities for job seekers' },
      service: { icon: '🔧', title: 'Service Offering', description: 'Offer your professional services' }
    }
    return displays[cat as keyof typeof displays] || displays.for_sale
  }

  const display = getCategoryDisplay(category)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
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

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-white/80 hover:text-white transition-colors mb-6 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            
            <div className="text-center relative">
              <div className="absolute top-0 right-0">
                <PWAInstallButton />
              </div>
              <div className="text-6xl mb-4">{display.icon}</div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Create New {display.title}
              </h1>
              <p className="text-xl text-white/80">
                {display.description}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-4xl mx-auto">
            <ListingForm
              initialData={{
                category: category as 'for_sale' | 'job' | 'service' | 'for_rent',
                location_city: user?.city || '',
                location_wilaya: user?.wilaya || ''
              }}
              mode="create"
              fixedCategory={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

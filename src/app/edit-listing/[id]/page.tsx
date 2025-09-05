// src/app/edit-listing/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Listing } from '@/types'
import ListingForm from '@/components/listings/ListingForm'

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/signin')
          return
        }

        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', listingId)
          .single()

        if (error) {
          setError('Listing not found')
          return
        }

        // Check if user owns this listing
        if (data.user_id !== session.user.id) {
          setError('You do not have permission to edit this listing')
          return
        }

        // Transform the data to match our Listing type
        const listingData: Listing = {
          ...data,
          metadata: (typeof data.metadata === 'object' && data.metadata !== null) 
            ? data.metadata as Record<string, unknown>
            : {},
          location_city: (data as Record<string, unknown>).location_city as string || '',
          location_wilaya: (data as Record<string, unknown>).location_wilaya as string || ''
        }

        setListing(listingData)
      } catch (err) {
        console.error('Error fetching listing:', err)
        setError('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      fetchListing()
    }
  }, [listingId, router])

  const handleSuccess = () => {
    router.push('/profile') // Redirect to user's listings
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading listing...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-red-600 font-medium mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Listing Not Found</h2>
          <p className="text-gray-600 mb-6">The listing you're trying to edit could not be found.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const getCategoryDisplay = (cat: string) => {
    const displays = {
      for_sale: { icon: '🛒', title: 'Item for Sale' },
      for_rent: { icon: '🏠', title: 'Item for Rent' },
      job: { icon: '💼', title: 'Job Posting' },
      service: { icon: '🔧', title: 'Service Offering' }
    }
    return displays[cat as keyof typeof displays] || displays.for_sale
  }

  const display = getCategoryDisplay(listing.category)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{display.icon}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Edit {display.title}
          </h1>
          <p className="text-xl text-gray-600">
            Update your listing information
          </p>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <ListingForm
            initialData={{
              title: listing.title,
              description: listing.description || '',
              category: listing.category,
              subcategory: listing.subcategory || '',
              price: listing.price?.toString() || '',
              location_city: listing.location_city || '',
              location_wilaya: listing.location_wilaya || '',
              photos: listing.photos || [],
              metadata: listing.metadata || {}
            }}
            listingId={listingId}
            mode="edit"
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * ContactSeller Component - Initiate Conversations with Sellers
 *
 * FLOW:
 * 1. Check if user is authenticated (redirect to signin if not)
 * 2. Call POST /api/messages/conversations to create/get conversation
 * 3. Navigate to /chat/{conversation_id}
 *
 * FEATURES:
 * - Prevents users from messaging their own listings
 * - Auto-creates conversation if doesn't exist
 * - Handles listing validation (active status check)
 * - Authorization header forwarding for API auth
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface ContactSellerProps {
  sellerId: string
  sellerName: string
  listingId: string
  listingTitle: string
  className?: string
}

export default function ContactSeller({
  sellerId,
  sellerName,
  listingId,
  listingTitle,
  className = ''
}: ContactSellerProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [isOwnListing, setIsOwnListing] = useState(false)

  // Check if current user is the seller
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsOwnListing(session?.user.id === sellerId)
    }
    checkUser()
  }, [sellerId])

  const handleContactSeller = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/signin?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    setShowContactInfo(true)
  }

  /**
   * Create conversation and navigate to chat
   * Why create conversation here: Ensures conversation exists before opening chat
   * Authorization header: Forwarded to API for RLS policies
   */
  const handleSendMessage = async () => {
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          buyer_id: session.user.id, // Current user is the buyer
          seller_id: sellerId,       // Listing owner is the seller
          listing_id: listingId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to start conversation')
      }

      const { conversation_id } = await response.json()
      
      // Navigate to the chat page
      router.push(`/chat/${conversation_id}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      
      // Show more specific error message
      if (error instanceof Error && error.message.includes('buyer_id and seller_id are required')) {
        alert('Unable to start conversation. Please try again.')
      } else if (error instanceof Error && error.message.includes('Listing not found')) {
        alert('This listing is no longer available.')
      } else if (error instanceof Error && error.message.includes('Listing is not active')) {
        alert('This listing is not currently available for messaging.')
      } else {
        alert('Failed to start conversation. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show if it's the user's own listing
  if (isOwnListing) {
    return null
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <button
          onClick={handleContactSeller}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          disabled={isLoading}
        >
          Contact Seller
        </button>
        
        <button
          onClick={handleSendMessage}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Starting conversation...
            </div>
          ) : (
            'Send Message'
          )}
        </button>
      </div>

      {showContactInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-semibold text-blue-900 mb-2">Contact Information</h4>
          <p className="text-blue-800 text-sm mb-2">
            Please be respectful when contacting the seller.
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-900">
              <span className="font-medium">Seller:</span> {sellerName}
            </p>
            <p className="text-blue-900">
              <span className="font-medium">Listing:</span> {listingTitle}
            </p>
            <p className="text-blue-700">
              Use the "Send Message" button above to contact this seller safely through our platform.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

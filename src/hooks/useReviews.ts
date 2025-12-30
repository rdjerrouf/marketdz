/**
 * useReviews Hooks - Complete Review Management System
 *
 * FEATURES:
 * - useReviews: Fetch and filter reviews with pagination
 * - useCreateReview: Submit new reviews (1-5 stars)
 * - useUpdateReview: Edit existing reviews
 * - useDeleteReview: Remove reviews
 * - useUserRating: Get average rating from profiles table
 *
 * FILTERING:
 * - By reviewedId: Reviews received by a user
 * - By reviewerId: Reviews written by a user
 * - By listingId: Reviews for a specific transaction
 */

'use client'

import { useState, useEffect } from 'react'
import { Review, CreateReviewData } from '@/types'
import { supabase } from '@/lib/supabase/client'

interface ReviewsData {
  reviews: Review[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

interface UseReviewsOptions {
  reviewedId?: string
  reviewerId?: string
  listingId?: string
  page?: number
  limit?: number
}

export function useReviews({
  reviewedId,
  reviewerId,
  listingId,
  page = 1,
  limit = 10
}: UseReviewsOptions = {}) {
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (reviewedId) params.append('reviewed_id', reviewedId)
      if (reviewerId) params.append('reviewer_id', reviewerId)
      if (listingId) params.append('listing_id', listingId)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const response = await fetch(`/api/reviews?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch reviews')
      }

      const reviewsData = await response.json()
      setData(reviewsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [reviewedId, reviewerId, listingId, page, limit])

  const refetch = () => {
    fetchReviews()
  }

  return {
    data,
    loading,
    error,
    refetch
  }
}

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReview = async (reviewData: CreateReviewData): Promise<Review> => {
    setLoading(true)
    setError(null)

    try {
      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers,
        body: JSON.stringify(reviewData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create review')
      }

      const review = await response.json()
      return review
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    createReview,
    loading,
    error
  }
}

export function useUpdateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateReview = async (reviewId: string, reviewData: Partial<CreateReviewData>): Promise<Review> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(reviewData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update review')
      }

      const review = await response.json()
      return review
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update review'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    updateReview,
    loading,
    error
  }
}

export function useDeleteReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteReview = async (reviewId: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete review')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete review'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    deleteReview,
    loading,
    error
  }
}

// Hook to get user's average rating and review stats
export function useUserRating(userId: string) {
  const [rating, setRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRating = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('rating, review_count')
          .eq('id', userId)
          .single()

        if (error) throw error

        setRating(data?.rating || 0)
        setReviewCount(data?.review_count || 0)
      } catch (error) {
        console.error('Error fetching user rating:', error)
        setRating(0)
        setReviewCount(0)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUserRating()
    }
  }, [userId])

  return { rating, reviewCount, loading }
}

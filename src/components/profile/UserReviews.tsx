// src/components/profile/UserReviews.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import styles from './UserReviews.module.css'

interface Review {
  id: string
  reviewer_id: string
  reviewed_id: string
  listing_id: string | null
  rating: number
  comment: string | null
  created_at: string
  reviewer: {
    first_name: string
    last_name: string
    avatar_url: string | null
  }
  listing?: {
    title: string
  } | null
}

interface UserReviewsProps {
  userId: string
  currentUserId?: string
}

export default function UserReviews({ userId, currentUserId }: UserReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Helper function to get rating bar width class
  const getRatingBarClass = (rating: number) => {
    const percentage = stats.totalReviews > 0 
      ? Math.round((stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown] / stats.totalReviews) * 100)
      : 0;
    
    // Round to nearest 5% for available CSS classes
    const roundedPercentage = Math.round(percentage / 5) * 5;
    return `bg-yellow-400 h-2 rounded-full ${styles.ratingBar} ${styles[`ratingBar${roundedPercentage}` as keyof typeof styles]}`;
  };
  const reviewsPerPage = 5

  useEffect(() => {
    fetchReviewsAndStats()
  }, [userId, currentPage])

  const fetchReviewsAndStats = async () => {
    try {
      setLoading(true)

      // Fetch reviews with pagination
      const { data: reviewsData, error: reviewsError, count } = await supabase
        .from('reviews')
        .select(`
          id,
          reviewer_id,
          reviewed_id,
          listing_id,
          rating,
          comment,
          created_at,
          reviewer:profiles!reviews_reviewer_id_fkey(
            first_name,
            last_name,
            avatar_url
          ),
          listing:listings(title)
        `, { count: 'exact' })
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage - 1)

      if (reviewsError) throw reviewsError

      setReviews(reviewsData || [])
      setTotalPages(Math.ceil((count || 0) / reviewsPerPage))

      // Fetch rating statistics
      const { data: statsData, error: statsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', userId)

      if (statsError) throw statsError

      if (statsData && statsData.length > 0) {
        const totalReviews = statsData.length
        const averageRating = statsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        
        const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        statsData.forEach(review => {
          ratingBreakdown[review.rating as keyof typeof ratingBreakdown]++
        })

        setStats({
          totalReviews,
          averageRating,
          ratingBreakdown
        })
      }

    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizes[size]} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } fill-current`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Rating Overview */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Reviews & Ratings</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="mb-2">
              {renderStars(Math.round(stats.averageRating), 'lg')}
            </div>
            <div className="text-gray-600">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center">
                <div className="flex items-center w-16">
                  <span className="text-sm font-medium text-gray-700 mr-2">{rating}</span>
                  <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className={getRatingBarClass(rating)} />
                  </div>
                </div>
                <div className="text-sm text-gray-600 w-8">
                  {stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        <h4 className="text-xl font-semibold text-gray-900">Recent Reviews</h4>
        
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">No reviews yet</div>
            <div className="text-gray-400 text-sm mt-1">
              Reviews will appear here once this user receives feedback
            </div>
          </div>
        ) : (
          <>
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start space-x-4">
                  {/* Reviewer Avatar */}
                  <div className="flex-shrink-0">
                    {review.reviewer.avatar_url ? (
                      <img
                        src={review.reviewer.avatar_url}
                        alt={`${review.reviewer.first_name} ${review.reviewer.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {review.reviewer.first_name[0]}{review.reviewer.last_name[0]}
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {review.reviewer.first_name} {review.reviewer.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                          {review.listing && (
                            <span className="ml-2">
                              • for "{review.listing.title}"
                            </span>
                          )}
                        </div>
                      </div>
                      {renderStars(review.rating, 'sm')}
                    </div>
                    
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 pt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-2 rounded-lg border ${
                      currentPage === i + 1
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

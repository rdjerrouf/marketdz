// src/app/profile/[id]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useReviews, useCreateReview, useUserRating } from '@/hooks/useReviews'
import { useUser } from '@/hooks/useUser'
import StarRating from '@/components/common/StarRating'
import ReviewCard from '@/components/common/ReviewCard'
import ReviewForm from '@/components/common/ReviewForm'
import { UserProfile } from '@/types'
import { supabase } from '@/lib/supabase/client'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter()
  const { user } = useUser()
  const { id: profileId } = use(params)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Get user's rating and review count
  const { rating, reviewCount, loading: ratingLoading } = useUserRating(profileId)

  // Get reviews for this user
  const { data: reviewsData, loading: reviewsLoading, refetch } = useReviews({
    reviewedId: profileId,
    page: currentPage,
    limit: 5
  })

  // Create review hook
  const { createReview, loading: createLoading } = useCreateReview()

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
        router.push('/404')
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [profileId, router])

  const handleCreateReview = async (reviewData: any) => {
    try {
      await createReview(reviewData)
      setShowReviewForm(false)
      refetch()

      // Redirect back after successful review submission
      setTimeout(() => {
        if (window.history.length > 2) {
          router.back()
        } else {
          router.push('/')
        }
      }, 1000) // Small delay to show success state
    } catch (error) {
      console.error('Error creating review:', error)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  if (profileLoading || ratingLoading) {
    return (
      <div className="min-h-screen bg-[#06402B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const isOwnProfile = user?.id === profileId
  const canReview = user && !isOwnProfile

  return (
    <div className="min-h-screen bg-[#06402B]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-white/80 hover:text-white transition-colors mb-6 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          {/* Profile Header */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20 shadow-2xl mb-8">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {getInitials(profile.first_name, profile.last_name)}
                  </span>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {profile.first_name} {profile.last_name}
                </h1>
                
                {profile.city && profile.wilaya && (
                  <p className="text-purple-200 mb-3">
                    📍 {profile.city}, {profile.wilaya}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <StarRating rating={rating} readonly showValue />
                    <span className="text-white text-sm">
                      ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>

                {/* Join Date */}
                <p className="text-purple-300 text-sm">
                  Member since {formatJoinDate(profile.created_at)}
                </p>

                {/* Review Button */}
                {canReview && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Leave a Review
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && canReview && (
            <div className="mb-8">
              <ReviewForm
                reviewedUserId={profileId}
                onSubmit={handleCreateReview}
                onCancel={() => setShowReviewForm(false)}
                isLoading={createLoading}
              />
            </div>
          )}

          {/* Reviews Section */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">
              Reviews ({reviewCount})
            </h2>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
              </div>
            ) : reviewsData && reviewsData.reviews.length > 0 ? (
              <>
                <div className="space-y-4">
                  {reviewsData.reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      canEdit={user?.id === review.reviewer_id}
                      canDelete={user?.id === review.reviewer_id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {reviewsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center mt-8 space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!reviewsData.pagination.hasPreviousPage}
                      className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-30 transition-all"
                    >
                      Previous
                    </button>

                    <span className="px-4 py-2 text-white">
                      Page {currentPage} of {reviewsData.pagination.totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!reviewsData.pagination.hasNextPage}
                      className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-30 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-white mb-2">No Reviews Yet</h3>
                <p className="text-purple-200">
                  This user hasn't received any reviews yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// src/components/common/ReviewForm.tsx
'use client'

import { useState } from 'react'
import { CreateReviewData } from '@/types'
import StarRating from './StarRating'

interface ReviewFormProps {
  reviewedUserId: string
  listingId?: string
  listingTitle?: string
  onSubmit: (reviewData: CreateReviewData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<CreateReviewData>
}

export default function ReviewForm({
  reviewedUserId,
  listingId,
  listingTitle,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialData?.rating || 0)
  const [comment, setComment] = useState(initialData?.comment || '')
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({})

  const validateForm = () => {
    const newErrors: { rating?: string; comment?: string } = {}

    if (rating === 0) {
      newErrors.rating = 'Please select a rating'
    }

    if (comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters long'
    }

    if (comment.trim().length > 500) {
      newErrors.comment = 'Comment cannot exceed 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit({
        reviewed_id: reviewedUserId,
        listing_id: listingId,
        rating,
        comment: comment.trim()
      })
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Leave a Review
        </h3>
        {listingTitle && (
          <p className="text-sm text-gray-600">
            Regarding listing: <span className="font-medium">{listingTitle}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
            />
            {rating > 0 && (
              <span className="text-sm text-gray-600">
                {rating}/5
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comment <span className="text-red-500">*</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe your experience with this user..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-black bg-white placeholder-gray-500"
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.comment && (
              <p className="text-red-500 text-sm">{errors.comment}</p>
            )}
            <p className="text-gray-500 text-sm ml-auto">
              {comment.length}/500
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || rating === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {isLoading ? 'Submitting...' : 'Submit Review'}
            </span>
          </button>
        </div>
      </form>
    </div>
  )
}

// src/components/common/ReviewCard.tsx
'use client'

import { useState } from 'react'
import { Review } from '@/types'
import StarRating from './StarRating'

interface ReviewCardProps {
  review: Review
  onEdit?: (review: Review) => void
  onDelete?: (reviewId: string) => void
  canEdit?: boolean
  canDelete?: boolean
}

export default function ReviewCard({
  review,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false
}: ReviewCardProps) {
  const [showActions, setShowActions] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
            {review.reviewer?.avatar_url ? (
              <img
                src={review.reviewer.avatar_url}
                alt={`${review.reviewer.first_name} ${review.reviewer.last_name}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-sm font-bold">
                {getInitials(review.reviewer?.first_name, review.reviewer?.last_name)}
              </span>
            )}
          </div>

          {/* Review Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">
                  {review.reviewer?.first_name} {review.reviewer?.last_name}
                </h4>
                <div className="flex items-center space-x-2">
                  <StarRating rating={review.rating} readonly size="sm" />
                  <span className="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </div>
              </div>

              {/* Actions Menu */}
              {(canEdit || canDelete) && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    title="Options"
                    aria-label="Comment options"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {showActions && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                      {canEdit && (
                        <button
                          onClick={() => {
                            onEdit?.(review)
                            setShowActions(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            onDelete?.(review.id)
                            setShowActions(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Review Comment */}
            {review.comment && (
              <p className="text-gray-700 text-sm leading-relaxed">
                {review.comment}
              </p>
            )}

            {/* Associated Listing */}
            {review.listing && (
              <div className="mt-3 p-2 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500 mb-1">Regarding listing:</p>
                <p className="text-sm font-medium text-gray-700">
                  {review.listing.title}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

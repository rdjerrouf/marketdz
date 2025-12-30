/**
 * StarRating Component - Interactive 5-Star Rating Display
 *
 * FEATURES:
 * - Interactive: Click to set rating (when not readonly)
 * - Hover preview: Shows rating before clicking
 * - Half stars: Supports decimal ratings (e.g., 4.5)
 * - Sizes: sm/md/lg variants
 *
 * MODES:
 * - Interactive: onRatingChange provided, readonly=false
 * - Display only: readonly=true (for showing existing ratings)
 */

'use client'

import { useState } from 'react'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export default function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className = ''
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoveredRating(starRating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoveredRating(0)
    }
  }

  const displayRating = hoveredRating || rating

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating
          const isHalf = !isFilled && star - 0.5 <= displayRating

          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              className={`${sizeClasses[size]} ${
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              } transition-transform duration-150 relative`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
            >
              <svg
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'text-yellow-400'
                    : isHalf
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              
              {/* Half star overlay */}
              {isHalf && (
                <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                  <svg
                    className={`${sizeClasses[size]} text-yellow-400`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

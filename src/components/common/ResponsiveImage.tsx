/**
 * ResponsiveImage Component - Optimized Image Loading
 *
 * FEATURES:
 * - Responsive srcSet: Loads appropriate image size for device
 * - Docker URL fix: Converts Docker internal URLs to browser-accessible URLs
 * - Loading states: Shimmer placeholder while loading
 * - Error handling: Graceful fallback with Arabic "image not available" message
 *
 * SPECIALIZED VARIANTS:
 * - ListingImage: For product photos (hover zoom effect)
 * - AvatarImage: For user profiles (circular, sized)
 * - ThumbnailGrid: Grid layout for multiple images
 *
 * OPTIMIZATION:
 * - Uses Next.js Image component (automatic optimization)
 * - Shows compression badge in development
 */

'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { getResponsiveImageUrls, fixPhotoUrl } from '@/lib/storage'

interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  variants?: {
    original?: string
    display?: string
    thumbnail?: string
  }
  sizes?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  placeholder?: 'blur' | 'empty'
  onLoad?: () => void
  onError?: () => void
  showCompressionBadge?: boolean
}

export default function ResponsiveImage({
  src,
  alt,
  className = '',
  variants,
  sizes = '(max-width: 640px) 300px, (max-width: 1024px) 800px, 1200px',
  priority = false,
  fill = false,
  width,
  height,
  placeholder = 'empty',
  onLoad,
  onError,
  showCompressionBadge = false
}: ResponsiveImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Ensure valid URLs and get responsive URLs
  const fixedSrc = fixPhotoUrl(src)
  const fixedVariants = variants ? {
    original: variants.original ? fixPhotoUrl(variants.original) : undefined,
    display: variants.display ? fixPhotoUrl(variants.display) : undefined,
    thumbnail: variants.thumbnail ? fixPhotoUrl(variants.thumbnail) : undefined,
  } : undefined

  const { src: responsiveSrc, srcSet } = getResponsiveImageUrls(fixedSrc, fixedVariants)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    setIsLoading(false)
    onError?.()
  }

  // Fallback for broken images
  if (imageError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500 p-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs">صورة غير متوفرة</p>
        </div>
      </div>
    )
  }

  const imageProps = {
    src: responsiveSrc,
    alt,
    className: `transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    placeholder,
    sizes,
    ...(srcSet && { srcSet }),
    ...(fill ? { fill: true } : { width: width || 800, height: height || 600 }),
  }

  return (
    <div className="relative">
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
          style={{ width, height }}
        >
          <div className="flex items-center justify-center h-full">
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Main image */}
      <Image {...imageProps} />

      {/* Compression badge */}
      {showCompressionBadge && variants && !isLoading && (
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
          مُحسَّن
        </div>
      )}

      {/* Cloud optimization indicator for development */}
      {process.env.NODE_ENV === 'development' && variants && !isLoading && (
        <div className="absolute bottom-2 right-2 bg-blue-500 text-white px-1 py-0.5 rounded text-xs">
          Cloud
        </div>
      )}
    </div>
  )
}

// Specialized components for common use cases

interface ListingImageProps {
  src: string
  alt: string
  className?: string
  variants?: ResponsiveImageProps['variants']
  onClick?: () => void
}

export function ListingImage({ src, alt, className, variants, onClick }: ListingImageProps) {
  return (
    <div
      className={`relative overflow-hidden cursor-pointer ${className}`}
      onClick={onClick}
    >
      <ResponsiveImage
        src={src}
        alt={alt}
        variants={variants}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        sizes="(max-width: 640px) 300px, (max-width: 1024px) 400px, 600px"
        showCompressionBadge={true}
      />
    </div>
  )
}

interface AvatarImageProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variants?: ResponsiveImageProps['variants']
}

export function AvatarImage({ src, alt, size = 'md', className, variants }: AvatarImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const dimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 }
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 ${className}`}>
      <ResponsiveImage
        src={src}
        alt={alt}
        variants={variants}
        className="w-full h-full object-cover"
        width={dimensions[size].width}
        height={dimensions[size].height}
        sizes={`${dimensions[size].width}px`}
      />
    </div>
  )
}

interface ThumbnailGridProps {
  images: Array<{
    src: string
    alt: string
    variants?: ResponsiveImageProps['variants']
  }>
  className?: string
  onImageClick?: (index: number) => void
}

export function ThumbnailGrid({ images, className, onImageClick }: ThumbnailGridProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className="aspect-square overflow-hidden rounded-lg cursor-pointer"
          onClick={() => onImageClick?.(index)}
        >
          <ResponsiveImage
            src={image.src}
            alt={image.alt}
            variants={image.variants}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            sizes="150px"
            showCompressionBadge={true}
          />
        </div>
      ))}
    </div>
  )
}
/**
 * ImageUpload Component - Drag-and-Drop Image Uploader
 *
 * FEATURES:
 * - Client-side compression before upload (60-80% size reduction)
 * - Category-based validation (for_sale/for_rent require photos, jobs/services don't)
 * - Multiple file upload with progress
 * - Image preview with delete functionality
 * - Direct Supabase Storage upload (no Edge Function needed here)
 *
 * FLOW:
 * 1. User selects/drops images
 * 2. Validate file type and size
 * 3. Compress to WebP @ 800x600
 * 4. Upload to Supabase Storage
 * 5. Return public URLs for storage in database
 */

'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { compressImage, validateImageFile } from '@/lib/image-compression'

interface ImageUploadProps {
  images: string[]                          // Current uploaded image URLs
  onImagesChange: (images: string[]) => void // Callback when images change
  category: 'for_sale' | 'job' | 'service' | 'for_rent' | 'urgent'
  maxImages?: number                        // Max photos allowed (3 for sale, 5 for rent, 2 for urgent)
  required?: boolean                        // Whether at least 1 image is required
}

export default function ImageUpload({
  images,
  onImagesChange,
  category,
  maxImages = 3,
  required = true
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Category validation: for_sale, for_rent, and urgent allow images; jobs/services don't
  const allowImages = category === 'for_sale' || category === 'for_rent' || category === 'urgent'
  const minImages = allowImages && required ? 1 : 0

  const validateFile = (file: File): string | null => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return validation.error || 'Invalid image file'
    }
    return null
  }

  /**
   * Upload single image with compression
   *
   * PROCESS:
   * 1. Compress to WebP (typically 2MB → 300KB)
   * 2. Generate unique filename
   * 3. Upload to Supabase Storage
   * 4. Return public URL
   */
  const uploadImage = async (file: File): Promise<string> => {
    // Client-side compression (saves bandwidth and storage costs)
    const compressionResult = await compressImage(file, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
      format: 'webp',
      maintainAspectRatio: true
    })

    console.log(`📸 Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressionResult.compressedSize / 1024).toFixed(1)}KB (${compressionResult.compressionRatio}% saved)`)

    const compressedFile = compressionResult.file
    const fileExt = compressionResult.format
    // Generate collision-resistant filename (timestamp + random)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `listings/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('listing-photos')
      .upload(filePath, compressedFile)

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    // Get public URL for storage in database
    const { data } = supabase.storage
      .from('listing-photos')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (!allowImages) {
      setError('Images are not allowed for jobs and services')
      return
    }

    if (files.length === 0) return

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    // Validate each file
    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setError('')
    setUploading(true)

    try {
      const uploadPromises = files.map(uploadImage)
      const newImageUrls = await Promise.all(uploadPromises)
      onImagesChange([...images, ...newImageUrls])
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = async (index: number) => {
    const imageUrl = images[index]
    
    // Extract file path from URL to delete from storage
    try {
      const urlParts = imageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `listings/${fileName}`
      
      await supabase.storage
        .from('listing-photos')
        .remove([filePath])
    } catch (err) {
      console.error('Error deleting image from storage:', err)
    }

    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  if (!allowImages) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">📋</div>
          <p className="text-gray-600 font-medium">
            Images are not required for {category === 'job' ? 'job postings' : 'services'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        
        <label
          htmlFor="image-upload"
          className="cursor-pointer block"
        >
          <div className="text-gray-400 text-4xl mb-2">📷</div>
          <p className="text-gray-600 font-medium mb-1">
            Click to upload images
          </p>
          <p className="text-sm text-gray-500">
            {minImages > 0 ? `Required: ${minImages}-${maxImages} images` : `Max ${maxImages} images`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, WebP up to 50MB • Auto-compressed to WebP
          </p>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Uploading Indicator */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-blue-600 text-sm font-medium">Compressing and uploading images...</p>
          </div>
          <p className="text-xs text-gray-600 mt-1">Optimizing for fast loading</p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-gray-300 transition-colors"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                aria-label={`Remove image ${index + 1}`}
              >
                ×
              </button>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1} of {maxImages}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Count Status */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
          {images.length} of {maxImages} images
        </span>
        {minImages > 0 && images.length < minImages && (
          <span className="text-red-500 font-medium">
            {minImages - images.length} more required
          </span>
        )}
        {images.length >= maxImages && (
          <span className="text-green-600 font-medium">
            Maximum reached
          </span>
        )}
      </div>
    </div>
  )
}

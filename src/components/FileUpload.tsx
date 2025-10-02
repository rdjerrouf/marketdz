'use client'

import React, { useState, useRef, useEffect } from 'react'
import { uploadFile, moderateContent, type UploadOptions } from '@/lib/storage'
import {
  createCompressionPreview,
  getCompressionStats,
  validateImageFile,
  cleanupPreviewUrl,
  type CompressionPreview
} from '@/lib/image-compression'

interface FileUploadProps {
  bucket: 'avatars' | 'listing-photos' | 'user-photos'
  listingId?: string
  purpose?: 'avatar' | 'listing' | 'document'
  onSuccess?: (result: any) => void
  onError?: (error: any) => void
  accept?: string
  maxFiles?: number
  className?: string
  children?: React.ReactNode
}

export default function FileUpload({
  bucket,
  listingId,
  purpose,
  onSuccess,
  onError,
  accept = 'image/jpeg,image/png,image/webp',
  maxFiles = 1,
  className = '',
  children
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [compressionPreview, setCompressionPreview] = useState<CompressionPreview | null>(null)
  const [showCompressionStats, setShowCompressionStats] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (compressionPreview?.previewUrl) {
        cleanupPreviewUrl(compressionPreview.previewUrl)
      }
    }
  }, [compressionPreview?.previewUrl])

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const filesArray = Array.from(files).slice(0, maxFiles)

    // For image files, create compression preview first
    if (filesArray.length === 1 && filesArray[0].type.startsWith('image/')) {
      await createImagePreview(filesArray[0])
    } else {
      uploadFiles(filesArray)
    }
  }

  const createImagePreview = async (file: File) => {
    setCompressing(true)
    setUploadProgress('جاري ضغط الصورة...')

    try {
      // Validate file first
      const validation = validateImageFile(file)
      if (!validation.valid) {
        onError?.({
          message: validation.error || 'Invalid image file',
          messageAr: 'ملف صورة غير صالح'
        })
        return
      }

      // Determine preview type based on bucket
      const previewType = bucket === 'avatars' ? 'avatar' :
                         bucket === 'listing-photos' ? 'listing' : 'listing'

      // Create compression preview
      const preview = await createCompressionPreview(file, previewType)
      setCompressionPreview(preview)
      setShowCompressionStats(true)
      setUploadProgress('جاهز للرفع - تم ضغط الصورة بنجاح!')

    } catch (error) {
      console.error('Compression preview failed:', error)
      onError?.({
        message: 'Failed to process image',
        messageAr: 'فشل في معالجة الصورة'
      })
    } finally {
      setCompressing(false)
    }
  }

  const proceedWithUpload = () => {
    if (compressionPreview) {
      uploadFiles([compressionPreview.previewFile])
    }
  }

  const cancelPreview = () => {
    if (compressionPreview?.previewUrl) {
      cleanupPreviewUrl(compressionPreview.previewUrl)
    }
    setCompressionPreview(null)
    setShowCompressionStats(false)
    setUploadProgress('')
  }

  const uploadFiles = async (files: File[]) => {
    if (uploading) return

    setUploading(true)
    setUploadProgress('جاري التحقق من الملفات...')

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`جاري رفع الملف ${i + 1} من ${files.length}...`)

        // Content moderation for images
        if (file.type.startsWith('image/')) {
          setUploadProgress('جاري فحص المحتوى...')
          const moderation = await moderateContent(file, 'image')
          
          if (!moderation.approved) {
            const suggestions = moderation.suggestions?.join(', ') || 'المحتوى غير مناسب'
            onError?.({
              message: 'Content rejected by moderation',
              messageAr: 'تم رفض المحتوى من قبل المراجعة',
              suggestions
            })
            continue
          }
        }

        // Upload file
        setUploadProgress('جاري رفع الملف...')
        const result = await uploadFile(file, {
          bucket,
          listingId,
          purpose
        })

        if (result.success) {
          onSuccess?.(result.data)
          setUploadProgress('تم رفع الملف بنجاح!')
        } else {
          onError?.(result.error)
          setUploadProgress('فشل في رفع الملف')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      onError?.({
        message: 'Upload failed',
        messageAr: 'فشل في رفع الملف'
      })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(''), 3000)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const getUploadAreaText = () => {
    switch (bucket) {
      case 'avatars':
        return {
          title: 'رفع صورة الملف الشخصي',
          titleEn: 'Upload Profile Picture',
          subtitle: 'اسحب الصورة هنا أو انقر للاختيار',
          subtitleEn: 'Drag image here or click to select',
          limit: '2MB حد أقصى'
        }
      case 'listing-photos':
        return {
          title: 'رفع صور المنتج',
          titleEn: 'Upload Product Photos',
          subtitle: 'اسحب الصور هنا أو انقر للاختيار',
          subtitleEn: 'Drag photos here or click to select',
          limit: '10MB حد أقصى'
        }
      default:
        return {
          title: 'رفع ملف',
          titleEn: 'Upload File',
          subtitle: 'اسحب الملف هنا أو انقر للاختيار',
          subtitleEn: 'Drag file here or click to select',
          limit: '5MB حد أقصى'
        }
    }
  }

  const uploadText = getUploadAreaText()

  // Render compression preview if available
  if (compressionPreview && showCompressionStats) {
    const stats = getCompressionStats(compressionPreview)

    return (
      <div className={`relative ${className}`}>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={compressionPreview.previewUrl}
              alt="Compressed preview"
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
              -{stats.ratio}% ضغط
            </div>
          </div>

          {/* Compression Stats */}
          <div className="p-4 space-y-3">
            <div className="text-sm font-medium text-gray-800">
              تحسين الصورة مكتمل
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">الحجم الأصلي:</span>
                <div className="font-medium">{stats.original}</div>
              </div>
              <div>
                <span className="text-gray-500">بعد الضغط:</span>
                <div className="font-medium text-green-600">{stats.compressed}</div>
              </div>
            </div>

            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              ✅ {stats.savings}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={proceedWithUpload}
                disabled={uploading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {uploading ? 'جاري الرفع...' : 'رفع الصورة'}
              </button>
              <button
                onClick={cancelPreview}
                disabled={uploading}
                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>

        {uploadProgress && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 text-center">
            {uploadProgress}
          </div>
        )}
      </div>
    )
  }

  if (children) {
    return (
      <div className={`relative ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploading || compressing}
          id="file-upload-hidden-1"
          aria-label={uploadText.title}
          title={uploadText.title}
        />
        <div
          onClick={handleClick}
          className={`cursor-pointer ${(uploading || compressing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {children}
        </div>
        {uploadProgress && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 text-center">
            {uploadProgress}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={uploading || compressing}
        id="file-upload-hidden-2"
        aria-label={uploadText.title}
        title={uploadText.title}
      />
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${(uploading || compressing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
        `}
      >
        <div className="space-y-2">
          <div className="text-lg font-medium text-gray-700">
            {uploadText.title}
          </div>
          <div className="text-sm text-gray-500">
            {uploadText.subtitle}
          </div>
          <div className="text-xs text-gray-400">
            JPEG, PNG, WebP - {uploadText.limit}
          </div>
          
          {(uploading || compressing) && (
            <div className="mt-4">
              <div className="animate-pulse flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              {uploadProgress && (
                <div className="mt-2 text-sm text-blue-600">
                  {uploadProgress}
                </div>
              )}
              {compressing && !uploadProgress && (
                <div className="mt-2 text-sm text-orange-600">
                  جاري ضغط الصورة...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Algeria-specific security and optimization notice */}
      <div className="mt-2 space-y-2">
        <div className="text-xs text-gray-500 bg-green-50 border border-green-200 rounded p-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span>
              محمي بنظام فلترة المحتوى الجزائري | Protected by Algeria content filtering
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <span>
              ضغط ذكي للصور - توفير البيانات | Smart image compression - Data saving
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
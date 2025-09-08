'use client'

import React, { useState, useRef } from 'react'
import { uploadFile, moderateContent, type UploadOptions } from '@/lib/storage'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const filesArray = Array.from(files).slice(0, maxFiles)
    uploadFiles(filesArray)
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
          disabled={uploading}
          id="file-upload-hidden-1"
          aria-label={uploadText.title}
          title={uploadText.title}
        />
        <div
          onClick={handleClick}
          className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        disabled={uploading}
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
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
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
          
          {uploading && (
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
            </div>
          )}
        </div>
      </div>

      {/* Algeria-specific security notice */}
      <div className="mt-2 text-xs text-gray-500 bg-green-50 border border-green-200 rounded p-2">
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
    </div>
  )
}
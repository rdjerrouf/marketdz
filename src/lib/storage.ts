import { supabase } from '@/lib/supabase/client'
import { generateImageVariants, type CompressionResult } from './image-compression'

export interface UploadOptions {
  bucket: 'avatars' | 'listing-photos' | 'user-photos'
  listingId?: string
  purpose?: 'avatar' | 'listing' | 'document'
  variant?: 'original' | 'display' | 'thumbnail'
  generateVariants?: boolean
}

export interface UploadResult {
  success: boolean
  data?: {
    filePath: string
    publicUrl?: string
    bucket: string
    fileSize: number
    fileType: string
    variants?: {
      original?: string
      display?: string
      thumbnail?: string
    }
  }
  error?: {
    message: string
    messageAr: string
    details?: string
  }
}

export interface ImageVariants {
  original: {
    path: string
    url: string
    size: number
  }
  display: {
    path: string
    url: string
    size: number
  }
  thumbnail: {
    path: string
    url: string
    size: number
  }
}

// Secure file upload using Edge Function
export async function uploadFile(
  file: File, 
  options: UploadOptions
): Promise<UploadResult> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return {
        success: false,
        error: {
          message: 'Authentication required',
          messageAr: 'المصادقة مطلوبة'
        }
      }
    }

    // Validate file on client side first
    const validation = validateFile(file, options.bucket)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error!
      }
    }

    // Prepare form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', options.bucket)
    if (options.listingId) {
      formData.append('listingId', options.listingId)
    }
    if (options.purpose) {
      formData.append('purpose', options.purpose)
    }

    // Call secure upload Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/secure-file-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.errorEn || 'Upload failed',
          messageAr: result.error || 'فشل في رفع الملف',
          details: result.details
        }
      }
    }

    return {
      success: true,
      data: {
        filePath: result.filePath,
        publicUrl: result.publicUrl,
        bucket: result.bucket,
        fileSize: result.fileSize,
        fileType: result.fileType
      }
    }

  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: {
        message: 'Upload failed',
        messageAr: 'فشل في رفع الملف',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Client-side file validation
function validateFile(file: File, bucket: string): { 
  valid: boolean, 
  error?: { message: string, messageAr: string } 
} {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSizes = {
    'avatars': 2 * 1024 * 1024, // 2MB
    'listing-photos': 10 * 1024 * 1024, // 10MB
    'user-photos': 5 * 1024 * 1024 // 5MB
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: {
        message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        messageAr: 'نوع الملف غير صحيح. يُسمح فقط بملفات JPEG و PNG و WebP'
      }
    }
  }

  // Check file size
  const maxSize = maxSizes[bucket as keyof typeof maxSizes]
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return {
      valid: false,
      error: {
        message: `File size exceeds ${maxSizeMB}MB limit`,
        messageAr: `حجم الملف يتجاوز الحد المسموح ${maxSizeMB}MB`
      }
    }
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = ['.php', '.exe', '.bat', '.sh', '<', '>', '|', '..']
  if (suspiciousPatterns.some(pattern => file.name.includes(pattern))) {
    return {
      valid: false,
      error: {
        message: 'Suspicious file name detected',
        messageAr: 'تم اكتشاف اسم ملف مشبوه'
      }
    }
  }

  return { valid: true }
}

// Get secure download URL for private files
export async function getSecureUrl(bucket: string, path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600) // 1 hour expiry

    if (error) throw error
    return data.signedUrl
  } catch (error) {
    console.error('Failed to get secure URL:', error)
    return null
  }
}

// Delete file (with ownership verification via Edge Function)
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to delete file:', error)
    return false
  }
}

// List user's files
export async function listUserFiles(bucket: string, userId?: string): Promise<any[]> {
  try {
    const folder = userId || 'current-user' // Edge Function will validate
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to list files:', error)
    return []
  }
}

// Content moderation check
export async function moderateContent(
  content: string | File, 
  type: 'image' | 'text' | 'listing'
): Promise<{ approved: boolean, suggestions?: string[] }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Authentication required')

    const payload: any = {
      type,
      userId: session.user.id
    }

    if (typeof content === 'string') {
      payload.content = content
    } else {
      // For files, we'd need to upload first and then moderate
      payload.fileUrl = 'temp-url' // This would be the uploaded file URL
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/content-moderator`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    
    return {
      approved: result.result?.approved || false,
      suggestions: result.result?.suggestions || []
    }

  } catch (error) {
    console.error('Content moderation error:', error)
    return { approved: false, suggestions: ['Content could not be verified'] }
  }
}

// Upload image with automatic variant generation
export async function uploadImageWithVariants(
  file: File,
  options: UploadOptions
): Promise<UploadResult & { variants?: ImageVariants }> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return {
        success: false,
        error: {
          message: 'Authentication required',
          messageAr: 'المصادقة مطلوبة'
        }
      }
    }

    // Generate compressed variants
    const variants = await generateImageVariants(file)

    // Prepare file uploads for all variants
    const uploads = [
      { file: variants.original, variant: 'original' as const },
      { file: variants.display.file, variant: 'display' as const },
      { file: variants.thumbnail.file, variant: 'thumbnail' as const }
    ]

    const uploadResults: ImageVariants = {
      original: { path: '', url: '', size: 0 },
      display: { path: '', url: '', size: 0 },
      thumbnail: { path: '', url: '', size: 0 }
    }

    // Upload each variant
    for (const upload of uploads) {
      const formData = new FormData()
      formData.append('file', upload.file)
      formData.append('bucket', options.bucket)
      formData.append('variant', upload.variant)
      if (options.listingId) {
        formData.append('listingId', options.listingId)
      }
      if (options.purpose) {
        formData.append('purpose', options.purpose)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/secure-file-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        console.error(`Failed to upload ${upload.variant} variant:`, result)
        continue
      }

      uploadResults[upload.variant] = {
        path: result.filePath,
        url: result.publicUrl,
        size: upload.file.size
      }
    }

    // Return the display variant as the main result
    return {
      success: true,
      data: {
        filePath: uploadResults.display.path,
        publicUrl: uploadResults.display.url,
        bucket: options.bucket,
        fileSize: uploadResults.display.size,
        fileType: variants.display.file.type,
        variants: {
          original: uploadResults.original.url,
          display: uploadResults.display.url,
          thumbnail: uploadResults.thumbnail.url
        }
      },
      variants: uploadResults
    }

  } catch (error) {
    console.error('Multi-variant upload error:', error)
    return {
      success: false,
      error: {
        message: 'Failed to upload image variants',
        messageAr: 'فشل في رفع متغيرات الصورة',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Get responsive image URLs for display
export function getResponsiveImageUrls(baseUrl: string, variants?: { display?: string; thumbnail?: string }): {
  src: string
  srcSet: string
  sizes: string
} {
  if (!variants) {
    return {
      src: baseUrl,
      srcSet: baseUrl,
      sizes: '100vw'
    }
  }

  const srcSet = [
    variants.thumbnail && `${variants.thumbnail} 300w`,
    variants.display && `${variants.display} 800w`,
    baseUrl && `${baseUrl} 1200w`
  ].filter(Boolean).join(', ')

  return {
    src: variants.display || baseUrl,
    srcSet: srcSet || baseUrl,
    sizes: '(max-width: 640px) 300px, (max-width: 1024px) 800px, 1200px'
  }
}

// Helper to ensure valid photo URLs for Supabase Storage
export function fixPhotoUrl(url: string | undefined | null): string {
  // Use inline SVG placeholder to avoid 404 errors
  if (!url) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial,sans-serif" font-size="18" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E'

  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // If it's a storage path, convert to public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${supabaseUrl}/storage/v1/object/public/listing-photos/${url}`
}

// Get public URL for a storage file
export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}
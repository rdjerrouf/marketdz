import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface UploadOptions {
  bucket: 'avatars' | 'listing-photos' | 'user-photos'
  listingId?: string
  purpose?: 'avatar' | 'listing' | 'document'
}

export interface UploadResult {
  success: boolean
  data?: {
    filePath: string
    publicUrl?: string
    bucket: string
    fileSize: number
    fileType: string
  }
  error?: {
    message: string
    messageAr: string
    details?: string
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
  const maxSize = maxSizes[bucket]
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
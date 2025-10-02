import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Algeria-specific security configuration
const ALGERIA_CONFIG = {
  // File restrictions
  maxFileSize: {
    avatar: 2 * 1024 * 1024, // 2MB for avatars
    listing: 10 * 1024 * 1024, // 10MB for listing photos  
    user: 5 * 1024 * 1024, // 5MB for user photos
  },
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  // Content filtering for Algeria context
  suspiciousPatterns: [
    // Common malicious patterns
    '<?php', 'eval(', 'base64_decode', 'shell_exec', 'exec(',
    // Script injection
    '<script', 'javascript:', 'onerror=', 'onload=',
    // Potentially sensitive content markers (adjust as needed)
    'gov.dz', 'military', 'classified'
  ],
  // Rate limiting
  maxUploadsPerMinute: 10,
  maxUploadsPerHour: 100,
}

interface UploadRequest {
  bucket: 'avatars' | 'listing-photos' | 'user-photos'
  listingId?: string
  purpose: 'avatar' | 'listing' | 'document'
  variant?: 'original' | 'display' | 'thumbnail'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Create Supabase client with user's JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucketType = formData.get('bucket') as string || 'user-photos'
    const listingId = formData.get('listingId') as string
    const purpose = formData.get('purpose') as string || 'user'
    const variant = formData.get('variant') as string || 'original'

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate file type
    if (!ALGERIA_CONFIG.allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          error: 'نوع الملف غير مسموح. يُسمح فقط بملفات JPEG، PNG، وWebP',
          errorEn: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate file size based on purpose
    const maxSize = ALGERIA_CONFIG.maxFileSize[purpose as keyof typeof ALGERIA_CONFIG.maxFileSize] || ALGERIA_CONFIG.maxFileSize.user
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return new Response(
        JSON.stringify({ 
          error: `حجم الملف يتجاوز الحد المسموح ${maxSizeMB}MB`,
          errorEn: `File size exceeds the ${maxSizeMB}MB limit`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(supabase, user.id)
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'تم تجاوز حد الرفع المسموح. حاول مرة أخرى لاحقاً',
          errorEn: 'Upload rate limit exceeded. Try again later.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Security validation
    const fileBuffer = await file.arrayBuffer()
    const securityCheck = validateFileContent(new Uint8Array(fileBuffer), file.name)
    
    if (!securityCheck.safe) {
      return new Response(
        JSON.stringify({ 
          error: 'تم اكتشاف محتوى مشبوه في الملف',
          errorEn: 'Potentially malicious content detected',
          details: securityCheck.reason
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate secure file path with variant support
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExt = file.name.split('.').pop()

    let filePath: string

    switch (bucketType) {
      case 'avatars':
        filePath = `${user.id}/${variant}-avatar-${timestamp}.${fileExt}`
        break
      case 'listing-photos':
        if (!listingId) {
          return new Response(
            JSON.stringify({ error: 'Listing ID required for listing photos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        // Verify user owns the listing
        const { data: listing } = await supabase
          .from('listings')
          .select('user_id')
          .eq('id', listingId)
          .single()

        if (!listing || listing.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized: You can only upload photos to your own listings' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        filePath = `${listingId}/${variant}-${timestamp}-${randomStr}.${fileExt}`
        break
      default:
        filePath = `${user.id}/${variant}-${timestamp}-${randomStr}.${fileExt}`
    }

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketType)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ 
          error: 'فشل في رفع الملف',
          errorEn: 'Upload failed',
          details: uploadError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the upload for audit purposes
    await logUpload(supabase, {
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      bucket: bucketType,
      path: filePath,
      purpose: purpose
    })

    // Get public URL if bucket is public
    let publicUrl = null
    if (bucketType === 'avatars' || bucketType === 'listing-photos') {
      const { data } = supabase
        .storage
        .from(bucketType)
        .getPublicUrl(filePath)
      publicUrl = data.publicUrl
    }

    return new Response(
      JSON.stringify({
        message: 'تم رفع الملف بنجاح',
        messageEn: 'File uploaded successfully',
        filePath: uploadData.path,
        publicUrl,
        bucket: bucketType,
        fileSize: file.size,
        fileType: file.type,
        variant: variant,
        compressionInfo: variant !== 'original' ? {
          optimized: true,
          variant: variant,
          originalSize: file.size
        } : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Upload processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'خطأ في معالجة الملف',
        errorEn: 'Failed to process upload',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Security validation function
function validateFileContent(fileData: Uint8Array, fileName: string): { safe: boolean, reason?: string } {
  // Check file extension vs content type mismatch
  const header = new TextDecoder('utf-8', { fatal: false }).decode(fileData.slice(0, 100))
  
  // Check for malicious patterns
  for (const pattern of ALGERIA_CONFIG.suspiciousPatterns) {
    if (header.toLowerCase().includes(pattern.toLowerCase())) {
      return { safe: false, reason: `Suspicious pattern detected: ${pattern}` }
    }
  }

  // Validate image file headers
  if (!hasValidImageHeader(fileData)) {
    return { safe: false, reason: 'Invalid image file header' }
  }

  // Check for embedded scripts in EXIF data
  const exifSection = extractExifData(fileData)
  if (exifSection && containsSuspiciousExif(exifSection)) {
    return { safe: false, reason: 'Suspicious EXIF data detected' }
  }

  // File name validation
  if (containsSuspiciousFileName(fileName)) {
    return { safe: false, reason: 'Suspicious file name' }
  }

  return { safe: true }
}

function hasValidImageHeader(data: Uint8Array): boolean {
  // JPEG header
  if (data[0] === 0xFF && data[1] === 0xD8) return true
  // PNG header  
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) return true
  // WebP header
  if (data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) return true
  
  return false
}

function extractExifData(data: Uint8Array): Uint8Array | null {
  // Simple EXIF extraction for JPEG files
  for (let i = 0; i < data.length - 4; i++) {
    if (data[i] === 0x45 && data[i+1] === 0x78 && data[i+2] === 0x69 && data[i+3] === 0x66) {
      return data.slice(i, Math.min(i + 1000, data.length))
    }
  }
  return null
}

function containsSuspiciousExif(exifData: Uint8Array): boolean {
  const exifText = new TextDecoder('utf-8', { fatal: false }).decode(exifData)
  return ALGERIA_CONFIG.suspiciousPatterns.some(pattern => 
    exifText.toLowerCase().includes(pattern.toLowerCase())
  )
}

function containsSuspiciousFileName(fileName: string): boolean {
  const suspicious = ['.php', '.exe', '.bat', '.sh', '.cmd', '..', '<', '>', '|', '&']
  return suspicious.some(pattern => fileName.toLowerCase().includes(pattern))
}

// Rate limiting function
async function checkRateLimit(supabase: any, userId: string): Promise<{ allowed: boolean }> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

  // Check uploads in the last hour and minute
  const { data: hourlyUploads } = await supabase
    .from('upload_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString())

  const { data: minutelyUploads } = await supabase
    .from('upload_logs') 
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', oneMinuteAgo.toISOString())

  const hourlyCount = hourlyUploads?.length || 0
  const minutelyCount = minutelyUploads?.length || 0

  return {
    allowed: hourlyCount < ALGERIA_CONFIG.maxUploadsPerHour && 
             minutelyCount < ALGERIA_CONFIG.maxUploadsPerMinute
  }
}

// Upload logging function
async function logUpload(supabase: any, uploadData: any): Promise<void> {
  try {
    await supabase
      .from('upload_logs')
      .insert({
        user_id: uploadData.userId,
        file_name: uploadData.fileName,
        file_size: uploadData.fileSize,
        bucket: uploadData.bucket,
        file_path: uploadData.path,
        purpose: uploadData.purpose,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log upload:', error)
    // Don't fail the upload if logging fails
  }
}
// Supabase Edge Function for Image Optimization
// Optimized for Algeria's mobile-first marketplace
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ImageOptimizationRequest {
  imageUrl: string
  variants: {
    thumbnail?: { width: number; height: number; quality: number }
    display?: { width: number; height: number; quality: number }
    original?: { preserve: boolean }
  }
  bucket: string
  userId: string
  listingId?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestData: ImageOptimizationRequest = await req.json()

    // Validate request
    if (!requestData.imageUrl || !requestData.bucket || !requestData.userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user owns the resource
    if (requestData.userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to resource' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Download the original image
    console.log('Downloading image:', requestData.imageUrl)
    const imageResponse = await fetch(requestData.imageUrl)

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer()
    const imageData = new Uint8Array(imageArrayBuffer)

    // For now, we'll use a placeholder optimization
    // In production, you'd use ImageMagick, Sharp, or similar
    const optimizedVariants = await optimizeImageVariants(imageData, requestData.variants)

    // Upload optimized variants to storage
    const uploadResults = await uploadVariants(
      supabase,
      optimizedVariants,
      requestData.bucket,
      requestData.userId,
      requestData.listingId
    )

    // Store metadata in database
    await storeImageMetadata(supabase, {
      userId: requestData.userId,
      listingId: requestData.listingId,
      originalUrl: requestData.imageUrl,
      variants: uploadResults,
      bucket: requestData.bucket
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Image optimization completed',
        variants: uploadResults
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Image optimization error:', error)

    return new Response(
      JSON.stringify({
        error: 'Image optimization failed',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Placeholder image optimization function
// In production, this would use proper image processing libraries
async function optimizeImageVariants(
  imageData: Uint8Array,
  variants: ImageOptimizationRequest['variants']
): Promise<{ [key: string]: { data: Uint8Array; filename: string; mimeType: string } }> {
  const results: { [key: string]: { data: Uint8Array; filename: string; mimeType: string } } = {}

  // For now, just return the original data for each variant
  // In production, you'd resize and compress here
  if (variants.original?.preserve) {
    results.original = {
      data: imageData,
      filename: 'original.webp',
      mimeType: 'image/webp'
    }
  }

  if (variants.display) {
    results.display = {
      data: imageData, // Would be resized to display dimensions
      filename: 'display.webp',
      mimeType: 'image/webp'
    }
  }

  if (variants.thumbnail) {
    results.thumbnail = {
      data: imageData, // Would be resized to thumbnail dimensions
      filename: 'thumbnail.webp',
      mimeType: 'image/webp'
    }
  }

  return results
}

// Upload variants to Supabase Storage
async function uploadVariants(
  supabase: any,
  variants: { [key: string]: { data: Uint8Array; filename: string; mimeType: string } },
  bucket: string,
  userId: string,
  listingId?: string
): Promise<{ [key: string]: string }> {
  const uploadResults: { [key: string]: string } = {}

  for (const [variantName, variantData] of Object.entries(variants)) {
    try {
      // Generate unique file path
      const timestamp = Date.now()
      const folderPath = listingId ? `${userId}/${listingId}` : userId
      const filePath = `${folderPath}/${variantName}-${timestamp}-${variantData.filename}`

      // Upload to storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, variantData.data, {
          contentType: variantData.mimeType,
          upsert: false
        })

      if (error) {
        console.error(`Failed to upload ${variantName}:`, error)
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      uploadResults[variantName] = urlData.publicUrl

    } catch (error) {
      console.error(`Error uploading ${variantName}:`, error)
    }
  }

  return uploadResults
}

// Store image metadata in database
async function storeImageMetadata(
  supabase: any,
  metadata: {
    userId: string
    listingId?: string
    originalUrl: string
    variants: { [key: string]: string }
    bucket: string
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('image_variants')
      .insert({
        user_id: metadata.userId,
        listing_id: metadata.listingId,
        original_url: metadata.originalUrl,
        variants: metadata.variants,
        bucket: metadata.bucket,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to store image metadata:', error)
    }

  } catch (error) {
    console.error('Error storing image metadata:', error)
  }
}

/* Deno.serve(serve) */
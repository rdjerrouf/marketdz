/**
 * Image Compression Utility - Client-Side Optimization
 *
 * WHY COMPRESSION:
 * - Algeria has slower mobile networks → smaller images load faster
 * - Reduces storage costs (Supabase storage)
 * - Improves page performance at 250k+ listing scale
 *
 * STRATEGY:
 * - Original: 800x600 @ 80% quality (display)
 * - Thumbnail: 300x300 @ 75% quality (grid views)
 * - Avatar: 200x200 @ 85% quality (profiles)
 * - Prefer WebP (70% smaller than JPEG, fallback to JPEG if unsupported)
 *
 * COMPRESSION SAVINGS: Typically 60-80% file size reduction
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  maintainAspectRatio?: boolean
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  width: number
  height: number
  format: string
}

export interface CompressionPreview {
  originalFile: File
  previewFile: File
  originalSize: number
  previewSize: number
  compressionRatio: number
  previewUrl: string
}

/**
 * Default compression presets optimized for Algeria's mobile-first market
 * Balances quality vs. file size for slower network conditions
 */
const DEFAULT_SETTINGS = {
  // Listing photos: balance quality and mobile performance (typical: 2MB → 300KB)
  listing: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    format: 'webp' as const
  },
  // Thumbnails: aggressive compression for grid views (typical: 2MB → 50KB)
  thumbnail: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.75,
    format: 'webp' as const
  },
  // Avatars: small but good quality (typical: 1MB → 30KB)
  avatar: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.85,
    format: 'webp' as const
  }
}

// Check if browser supports WebP
function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

// Load image from file
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Calculate optimal dimensions maintaining aspect ratio
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight }

  // Scale down if needed
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }

  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * Compress image using HTML5 Canvas API
 *
 * PROCESS:
 * 1. Load image into memory
 * 2. Calculate optimal dimensions (maintain aspect ratio)
 * 3. Draw resized image to canvas with high-quality smoothing
 * 4. Convert to WebP/JPEG with specified quality
 * 5. Return compressed File object
 *
 * PERFORMANCE: Runs entirely client-side (no server load)
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8,
    format = 'webp',
    maintainAspectRatio = true
  } = options

  try {
    // Load image into memory
    const img = await loadImage(file)
    const originalSize = file.size

    // Calculate new dimensions (maintains aspect ratio by default)
    const { width, height } = maintainAspectRatio
      ? calculateDimensions(img.width, img.height, maxWidth, maxHeight)
      : { width: maxWidth, height: maxHeight }

    // Create canvas for resizing
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    canvas.width = width
    canvas.height = height

    // Use high-quality smoothing (better than browser default)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw resized image
    ctx.drawImage(img, 0, 0, width, height)

    // Clean up to prevent memory leaks
    URL.revokeObjectURL(img.src)

    // Fallback to JPEG if browser doesn't support WebP
    const browserSupportsWebP = await supportsWebP()
    let outputFormat = format

    if (format === 'webp' && !browserSupportsWebP) {
      outputFormat = 'jpeg'
    }

    // Convert to blob
    const mimeType = `image/${outputFormat}`
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve as BlobCallback, mimeType, quality)
    })

    if (!blob) {
      throw new Error('Failed to compress image')
    }

    // Create compressed file
    const compressedFile = new File(
      [blob],
      file.name.replace(/\.[^/.]+$/, `.${outputFormat}`),
      { type: mimeType }
    )

    const compressedSize = compressedFile.size
    const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100)

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      width,
      height,
      format: outputFormat
    }

  } catch (error) {
    console.error('Image compression failed:', error)
    throw new Error('Failed to compress image')
  }
}

// Create preview with compression - for immediate user feedback
export async function createCompressionPreview(
  file: File,
  previewType: 'listing' | 'thumbnail' | 'avatar' = 'listing'
): Promise<CompressionPreview> {
  const settings = DEFAULT_SETTINGS[previewType]

  try {
    const result = await compressImage(file, settings)
    const previewUrl = URL.createObjectURL(result.file)

    return {
      originalFile: file,
      previewFile: result.file,
      originalSize: file.size,
      previewSize: result.compressedSize,
      compressionRatio: result.compressionRatio,
      previewUrl
    }
  } catch (error) {
    console.error('Preview creation failed:', error)
    throw error
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Get compression stats for display
export function getCompressionStats(preview: CompressionPreview) {
  const originalSizeFormatted = formatFileSize(preview.originalSize)
  const compressedSizeFormatted = formatFileSize(preview.previewSize)
  const savingsPercent = preview.compressionRatio
  const savingsBytes = preview.originalSize - preview.previewSize

  return {
    original: originalSizeFormatted,
    compressed: compressedSizeFormatted,
    savings: `${savingsPercent}% (${formatFileSize(savingsBytes)} saved)`,
    ratio: preview.compressionRatio
  }
}

// Validate image file before compression
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 50 * 1024 * 1024 // 50MB max original

  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, and WebP images are supported'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image file is too large (max 50MB)'
    }
  }

  return { valid: true }
}

/**
 * Generate multiple image variants in parallel
 *
 * CREATES:
 * - Original: Keep for archive/quality
 * - Display: 800x600 for listing detail pages
 * - Thumbnail: 300x300 for grid views
 *
 * Used by: uploadImageWithVariants() in storage.ts
 */
export async function generateImageVariants(file: File): Promise<{
  original: File
  display: CompressionResult
  thumbnail: CompressionResult
}> {
  try {
    // Compress both variants in parallel (faster than sequential)
    const [displayResult, thumbnailResult] = await Promise.all([
      compressImage(file, DEFAULT_SETTINGS.listing),
      compressImage(file, DEFAULT_SETTINGS.thumbnail)
    ])

    return {
      original: file,
      display: displayResult,
      thumbnail: thumbnailResult
    }
  } catch (error) {
    console.error('Failed to generate image variants:', error)
    throw error
  }
}

// Clean up preview URLs to prevent memory leaks
export function cleanupPreviewUrl(url: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
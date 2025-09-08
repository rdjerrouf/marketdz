import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Algeria-specific content moderation rules
const ALGERIA_MODERATION_CONFIG = {
  // Forbidden content patterns (Algeria context)
  prohibitedContent: [
    // Political sensitivity
    'gouvernement', 'président', 'ministre', 'politique',
    // Religious sensitivity  
    'haram', 'halal', 'religion',
    // Security related
    'police', 'militaire', 'sécurité', 'armée',
    // Inappropriate content
    'nude', 'adult', 'sex', 'porn',
    // Scam indicators
    'argent facile', 'get rich quick', 'miracle', 'guaranteed'
  ],
  
  // Suspicious domains/URLs that shouldn't appear in images
  suspiciousDomains: [
    'bit.ly', 'tinyurl.com', 't.co',
    // Add Algeria-specific suspicious domains
    'fake-dz.com', 'scam-algeria.net'
  ],

  // Country-specific validation
  algeria: {
    // Validate Algerian phone numbers in images/text
    phonePattern: /(\+213|0)(5|6|7)[0-9]{8}/g,
    // Validate Algerian postal codes
    postalPattern: /[0-9]{5}/g,
    // Wilaya validation
    validWilayas: [
      'Alger', 'Oran', 'Constantine', 'Annaba', 'Batna', 
      'Sétif', 'Sidi Bel Abbès', 'Biskra', 'Tébessa', 'Tiaret'
      // Add more wilayas as needed
    ]
  }
}

interface ModerationRequest {
  fileUrl?: string
  content?: string
  type: 'image' | 'text' | 'listing' | 'profile'
  userId: string
  context?: {
    listingId?: string
    category?: string
  }
}

interface ModerationResult {
  approved: boolean
  confidence: number
  flags: string[]
  suggestions?: string[]
  algeriaSpecific?: {
    validPhone?: boolean
    validLocation?: boolean
    culturallyAppropriate?: boolean
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { fileUrl, content, type, userId, context }: ModerationRequest = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let moderationResult: ModerationResult

    switch (type) {
      case 'image':
        if (!fileUrl) {
          return new Response(
            JSON.stringify({ error: 'File URL required for image moderation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        moderationResult = await moderateImage(fileUrl, supabase)
        break
      
      case 'text':
      case 'listing':
      case 'profile':
        if (!content) {
          return new Response(
            JSON.stringify({ error: 'Content required for text moderation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        moderationResult = await moderateText(content, type, context)
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid moderation type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Log moderation result
    await logModerationResult(supabase, {
      userId,
      type,
      result: moderationResult,
      fileUrl,
      content: content ? content.substring(0, 500) : null, // Truncate for logging
      context
    })

    // If content is flagged, create a moderation case
    if (!moderationResult.approved) {
      await createModerationCase(supabase, {
        userId,
        type,
        content: content || fileUrl,
        flags: moderationResult.flags,
        confidence: moderationResult.confidence,
        context
      })
    }

    return new Response(
      JSON.stringify({
        result: moderationResult,
        message: moderationResult.approved ? 
          'المحتوى مناسب ومقبول' : 
          'المحتوى يحتاج إلى مراجعة',
        messageEn: moderationResult.approved ?
          'Content approved' :
          'Content requires review'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Content moderation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'خطأ في فحص المحتوى',
        errorEn: 'Content moderation failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function moderateImage(fileUrl: string, supabase: any): Promise<ModerationResult> {
  const flags: string[] = []
  let confidence = 0.8

  try {
    // Fetch image for analysis
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }

    const imageBuffer = await response.arrayBuffer()
    const imageData = new Uint8Array(imageBuffer)

    // Basic image analysis
    const imageAnalysis = analyzeImageContent(imageData)
    
    if (imageAnalysis.suspiciousContent) {
      flags.push('suspicious_image_content')
      confidence = 0.9
    }

    if (imageAnalysis.hasEmbeddedText) {
      // Extract and moderate embedded text
      const textResult = await moderateText(imageAnalysis.extractedText, 'image')
      if (!textResult.approved) {
        flags.push(...textResult.flags.map(flag => `image_text_${flag}`))
        confidence = Math.max(confidence, textResult.confidence)
      }
    }

    // Check for inappropriate content markers
    if (containsInappropriateVisualContent(imageData)) {
      flags.push('inappropriate_visual_content')
      confidence = 0.95
    }

    return {
      approved: flags.length === 0,
      confidence,
      flags,
      suggestions: generateImageSuggestions(flags)
    }

  } catch (error) {
    console.error('Image moderation error:', error)
    return {
      approved: false,
      confidence: 0.5,
      flags: ['moderation_error'],
      suggestions: ['إعادة رفع الصورة', 'Re-upload the image']
    }
  }
}

async function moderateText(
  content: string, 
  type: string, 
  context?: any
): Promise<ModerationResult> {
  const flags: string[] = []
  let confidence = 0.7
  const algeriaSpecific: any = {}

  // Convert to lowercase for case-insensitive matching
  const lowerContent = content.toLowerCase()

  // Check for prohibited content
  for (const prohibited of ALGERIA_MODERATION_CONFIG.prohibitedContent) {
    if (lowerContent.includes(prohibited.toLowerCase())) {
      flags.push(`prohibited_content_${prohibited}`)
      confidence = Math.max(confidence, 0.85)
    }
  }

  // Check for suspicious domains
  for (const domain of ALGERIA_MODERATION_CONFIG.suspiciousDomains) {
    if (lowerContent.includes(domain)) {
      flags.push(`suspicious_domain_${domain}`)
      confidence = Math.max(confidence, 0.8)
    }
  }

  // Algeria-specific validations
  const phoneMatches = content.match(ALGERIA_MODERATION_CONFIG.algeria.phonePattern)
  if (phoneMatches && phoneMatches.length > 3) {
    flags.push('excessive_phone_numbers')
    confidence = Math.max(confidence, 0.75)
  }
  algeriaSpecific.validPhone = phoneMatches ? validateAlgerianPhone(phoneMatches[0]) : null

  // Location validation
  const hasValidLocation = ALGERIA_MODERATION_CONFIG.algeria.validWilayas.some(
    wilaya => lowerContent.includes(wilaya.toLowerCase())
  )
  algeriaSpecific.validLocation = hasValidLocation

  // Scam detection patterns
  const scamPatterns = [
    /\d+\s*(dinar|da|dzd)/gi,
    /whatsapp.*\+213/gi,
    /livraison.*gratuit/gi,
    /promotion.*limitée/gi
  ]

  for (const pattern of scamPatterns) {
    if (pattern.test(content)) {
      flags.push('potential_scam_pattern')
      confidence = Math.max(confidence, 0.8)
      break
    }
  }

  // Text quality checks for listings
  if (type === 'listing') {
    if (content.length < 10) {
      flags.push('insufficient_description')
      confidence = Math.max(confidence, 0.6)
    }

    if (containsExcessiveCapsLock(content)) {
      flags.push('excessive_caps')
      confidence = Math.max(confidence, 0.4)
    }
  }

  // Cultural appropriateness check
  algeriaSpecific.culturallyAppropriate = !flags.some(flag => 
    flag.includes('prohibited_content') || flag.includes('inappropriate')
  )

  return {
    approved: flags.length === 0 || (flags.length === 1 && flags[0].includes('insufficient_description')),
    confidence,
    flags,
    suggestions: generateTextSuggestions(flags, type),
    algeriaSpecific
  }
}

// Helper functions for image analysis
function analyzeImageContent(imageData: Uint8Array): {
  suspiciousContent: boolean
  hasEmbeddedText: boolean
  extractedText: string
} {
  // Basic suspicious content detection in images
  // This is simplified - in production, use proper image analysis services
  
  const header = new TextDecoder('utf-8', { fatal: false }).decode(imageData.slice(0, 200))
  
  return {
    suspiciousContent: ALGERIA_MODERATION_CONFIG.prohibitedContent.some(
      pattern => header.toLowerCase().includes(pattern.toLowerCase())
    ),
    hasEmbeddedText: header.includes('text') || header.includes('comment'),
    extractedText: header // Simplified - would use proper OCR in production
  }
}

function containsInappropriateVisualContent(imageData: Uint8Array): boolean {
  // This would typically use computer vision APIs
  // For now, we'll do basic header analysis
  const header = imageData.slice(0, 100)
  
  // Check for markers that might indicate inappropriate content
  // This is very basic and would be replaced with proper CV analysis
  return false // Placeholder
}

function validateAlgerianPhone(phone: string): boolean {
  // Validate Algerian phone number format
  return /^(\+213|0)(5|6|7)[0-9]{8}$/.test(phone.replace(/\s/g, ''))
}

function containsExcessiveCapsLock(text: string): boolean {
  const capsCount = (text.match(/[A-Z]/g) || []).length
  const totalLetters = (text.match(/[A-Za-z]/g) || []).length
  return totalLetters > 10 && (capsCount / totalLetters) > 0.7
}

function generateImageSuggestions(flags: string[]): string[] {
  const suggestions = []
  
  if (flags.includes('suspicious_image_content')) {
    suggestions.push('تأكد من أن الصورة لا تحتوي على محتوى مشبوه')
    suggestions.push('Ensure image does not contain suspicious content')
  }
  
  if (flags.some(f => f.includes('inappropriate'))) {
    suggestions.push('استخدم صور مناسبة للعائلة فقط')
    suggestions.push('Use family-friendly images only')
  }
  
  return suggestions
}

function generateTextSuggestions(flags: string[], type: string): string[] {
  const suggestions = []
  
  if (flags.includes('insufficient_description')) {
    suggestions.push('أضف وصف أكثر تفصيلاً')
    suggestions.push('Add a more detailed description')
  }
  
  if (flags.includes('excessive_caps')) {
    suggestions.push('تجنب الإفراط في استخدام الأحرف الكبيرة')
    suggestions.push('Avoid excessive use of capital letters')
  }
  
  if (flags.some(f => f.includes('scam'))) {
    suggestions.push('تأكد من أن المحتوى صادق ولا يحتوي على عروض مضللة')
    suggestions.push('Ensure content is honest and does not contain misleading offers')
  }
  
  return suggestions
}

// Logging functions
async function logModerationResult(supabase: any, logData: any): Promise<void> {
  try {
    await supabase
      .from('moderation_logs')
      .insert({
        user_id: logData.userId,
        type: logData.type,
        approved: logData.result.approved,
        confidence: logData.result.confidence,
        flags: logData.result.flags,
        file_url: logData.fileUrl,
        content_preview: logData.content,
        context: logData.context,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log moderation result:', error)
  }
}

async function createModerationCase(supabase: any, caseData: any): Promise<void> {
  try {
    await supabase
      .from('moderation_cases')
      .insert({
        user_id: caseData.userId,
        type: caseData.type,
        content: caseData.content,
        flags: caseData.flags,
        confidence: caseData.confidence,
        status: 'pending',
        context: caseData.context,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to create moderation case:', error)
  }
}
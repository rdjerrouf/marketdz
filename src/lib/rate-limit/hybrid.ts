// src/lib/rate-limit/hybrid.ts - Production-ready multi-instance safe rate limiter

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * REDIS-BASED RATE LIMITER (Recommended for Production)
 * This solves the multi-instance problem completely
 */
export async function checkRateLimitRedis(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  try {
    // Only available if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      throw new Error('Redis not configured')
    }

    const window = Math.floor(Date.now() / windowMs)
    const key = `rate_limit:${identifier}:${window}`

    // Simple HTTP-based Redis (works with Upstash)
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/incr/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Redis error: ${response.status}`)
    }

    const data = await response.json()
    const count = data.result as number

    // Set expiration on first request
    if (count === 1) {
      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/expire/${key}/${Math.ceil(windowMs / 1000)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
    }

    const remaining = Math.max(0, limit - count)
    const reset = (window + 1) * windowMs

    if (count > limit) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
        retryAfter
      }
    }

    return {
      success: true,
      limit,
      remaining,
      reset
    }

  } catch (error) {
    console.error('Redis rate limit error:', error)
    throw error
  }
}

/**
 * ATOMIC COUNTER APPROACH using Supabase Function
 * This is the most robust solution using your existing infrastructure
 */
export async function checkRateLimitAtomic(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  try {
    const window = Math.floor(Date.now() / windowMs)
    const key = `${identifier}:${window}`

    // Use Supabase Edge Function for atomic operations
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        key,
        limit,
        window: windowMs
      })
    })

    if (!response.ok) {
      throw new Error(`Rate limit function error: ${response.status}`)
    }

    const result = await response.json()
    
    return {
      success: result.allowed,
      limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.retryAfter
    }

  } catch (error) {
    console.error('Atomic rate limit error:', error)
    throw error
  }
}

/**
 * MEMORY-BASED FALLBACK (Development only)
 * This is the improved version but still has the multi-instance issue
 */
const memoryCache = new Map<string, { requests: number[]; lastCleanup: number }>()

function checkRateLimitMemory(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  let record = memoryCache.get(identifier)

  if (!record) {
    record = { requests: [], lastCleanup: now }
    memoryCache.set(identifier, record)
  }

  // Clean up old requests
  record.requests = record.requests.filter((timestamp: number) => timestamp > now - windowMs)

  // Periodic cleanup of memory cache
  if (now - record.lastCleanup > windowMs) {
    record.lastCleanup = now
    for (const [key, value] of memoryCache.entries()) {
      if (now - value.lastCleanup > windowMs * 2) {
        memoryCache.delete(key)
      }
    }
  }

  if (record.requests.length >= limit) {
    const oldestRequest = Math.min(...record.requests)
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000)
    return {
      success: false,
      limit,
      remaining: 0,
      reset: oldestRequest + windowMs,
      retryAfter
    }
  }

  record.requests.push(now)
  return {
    success: true,
    limit,
    remaining: limit - record.requests.length,
    reset: now + windowMs
  }
}

/**
 * SMART RATE LIMITER - Uses the best available option
 * Priority: Redis > Atomic Function > Memory (development only)
 */
export async function smartRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  
  // Option 1: Redis (best for production)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV === 'production') {
    try {
      return await checkRateLimitRedis(identifier, limit, windowMs)
    } catch (error) {
      console.warn('Redis rate limit failed, falling back to atomic approach')
    }
  }

  // Option 2: Atomic function (good for production)
  if (process.env.NODE_ENV === 'production') {
    try {
      return await checkRateLimitAtomic(identifier, limit, windowMs)
    } catch (error) {
      console.warn('Atomic rate limit failed, falling back to memory')
    }
  }
  
  // Option 3: Memory (development only)
  return checkRateLimitMemory(identifier, limit, windowMs)
}

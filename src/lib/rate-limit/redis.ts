// src/lib/rate-limit/redis.ts - Production-ready Redis rate limiter
import { Redis } from '@upstash/redis'

// Initialize Redis client (works with Upstash)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

export async function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000 // 1 minute
): Promise<RateLimitResult> {
  try {
    const key = `rate_limit:${identifier}`
    const window = Math.floor(Date.now() / windowMs)
    const windowKey = `${key}:${window}`

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()
    pipeline.incr(windowKey)
    pipeline.expire(windowKey, Math.ceil(windowMs / 1000))
    
    const results = await pipeline.exec()
    const count = results[0] as number

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
    // Fallback: allow request if Redis is down (fail-open)
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Date.now() + windowMs
    }
  }
}

// Fallback in-memory rate limiter for development
const memoryCache = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimitMemory(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now()
  const record = memoryCache.get(identifier)

  if (!record || now > record.resetTime) {
    memoryCache.set(identifier, { count: 1, resetTime: now + windowMs })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs
    }
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetTime,
      retryAfter
    }
  }

  record.count++
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetTime
  }
}

// Smart rate limiter that uses Redis in production, memory in development
export async function smartRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  // Use Redis in production if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV === 'production') {
    return await checkRateLimit(identifier, limit, windowMs)
  }
  
  // Fallback to memory in development
  return checkRateLimitMemory(identifier, limit, windowMs)
}

// Database-based rate limiting with Supabase
// Note: This requires the rate_limits table to be created in your database
// For production, prefer Redis-based rate limiting for better performance

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { RateLimit } from '@/types'

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// Memory-based fallback rate limiter
const memoryStore = new Map<string, { count: number; reset: number }>()

function checkRateLimitMemory(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const windowStart = Math.floor(now / windowMs) * windowMs
  const reset = windowStart + windowMs
  const key = `${identifier}:${windowStart}`

  const current = memoryStore.get(key) || { count: 0, reset }
  
  // Clean up old entries
  for (const [k, v] of memoryStore.entries()) {
    if (v.reset <= now) {
      memoryStore.delete(k)
    }
  }

  current.count++
  memoryStore.set(key, current)

  const remaining = Math.max(0, limit - current.count)

  if (current.count > limit) {
    const retryAfter = Math.ceil((reset - now) / 1000)
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
}

// Database rate limiter - simplified for now
export async function checkRateLimitDatabase(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // For now, fall back to memory-based until database types are properly set up
  console.log('Using memory fallback for rate limiting (database types not configured)')
  return checkRateLimitMemory(identifier, limit, windowMs)
}

// Smart rate limiter that uses database in production, memory in development
export async function smartRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  // Use database in production
  if (process.env.NODE_ENV === 'production') {
    return checkRateLimitDatabase(identifier, limit, windowMs)
  }
  
  // Use memory in development
  return checkRateLimitMemory(identifier, limit, windowMs)
}

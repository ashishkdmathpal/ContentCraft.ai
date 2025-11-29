// Rate Limiting for Authentication Endpoints
// Prevents brute force attacks and abuse

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting
// In production, use Redis for distributed rate limiting
const store: RateLimitStore = {}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

// Default configurations
export const RATE_LIMITS = {
  // Strict limit for login attempts (prevent brute force)
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // Moderate limit for registration (prevent spam)
  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour
  },
  // General API rate limit
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry information
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const now = Date.now()
  const record = store[identifier]

  // No previous requests or window has expired
  if (!record || now > record.resetTime) {
    store[identifier] = {
      count: 1,
      resetTime: now + config.windowMs,
    }

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  // Increment count
  record.count++

  // Check if limit exceeded
  if (record.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Reset rate limit for an identifier (useful for testing or manual intervention)
 */
export function resetRateLimit(identifier: string): void {
  delete store[identifier]
}

/**
 * Clean up expired rate limit records (call periodically)
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now()

  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000)
}

/**
 * Get identifier from request (IP address)
 * In production, consider using a combination of IP + User-Agent
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (common proxy headers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  // Use the first available IP
  const ip =
    cfConnectingIp ||
    realIp ||
    (forwarded ? forwarded.split(',')[0].trim() : null) ||
    'unknown'

  return ip
}

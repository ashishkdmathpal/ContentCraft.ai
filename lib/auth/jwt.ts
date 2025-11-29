// JWT Token Management
// Access tokens: 15 minutes (short-lived)
// Refresh tokens: 7 days (long-lived)

import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-this'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-this'

const ACCESS_EXPIRY = '15m' // 15 minutes
const REFRESH_EXPIRY = '7d' // 7 days

export interface JWTPayload {
  userId: string
  email: string
  tenantId?: string
  role?: string
}

/**
 * Sign an access token (short-lived)
 */
export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  })
}

/**
 * Sign a refresh token (long-lived)
 */
export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  })
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: JWTPayload) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  }
}

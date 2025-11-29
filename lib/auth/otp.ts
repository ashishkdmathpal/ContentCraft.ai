// OTP (One-Time Password) Utilities
// Generates and validates 6-digit OTP codes for email verification

import crypto from 'crypto'

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  // Generate a random 6-digit number
  const otp = crypto.randomInt(100000, 999999).toString()
  return otp
}

/**
 * Generate a secure reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Calculate OTP expiry time (default 10 minutes)
 */
export function getOTPExpiry(minutes: number = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}

/**
 * Calculate reset token expiry time (default 30 minutes)
 */
export function getResetTokenExpiry(minutes: number = 30): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}

/**
 * Check if OTP/token has expired
 */
export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true
  return new Date() > expiresAt
}

/**
 * Verify OTP matches (case-insensitive, trimmed)
 */
export function verifyOTP(provided: string, stored: string): boolean {
  return provided.trim() === stored.trim()
}

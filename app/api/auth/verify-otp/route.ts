// Verify OTP API Route
// POST /api/auth/verify-otp - Verify email using OTP

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyOTP, isExpired } from '@/lib/auth/otp'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/auth/rate-limit'
import prisma from '@/lib/db/prisma'

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent brute force OTP guessing
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(`verify-otp:${clientId}`, RATE_LIMITS.LOGIN)

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Too many attempts. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }

    const body = await request.json()
    const validatedData = verifyOTPSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Check if OTP exists
    if (!user.emailVerificationOTP) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if OTP expired
    if (isExpired(user.otpExpiresAt)) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify OTP
    if (!verifyOTP(validatedData.otp, user.emailVerificationOTP)) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Mark email as verified and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationOTP: null,
        otpExpiresAt: null,
      },
    })

    return NextResponse.json(
      {
        message: 'Email verified successfully!',
        emailVerified: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verify OTP error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to verify code. Please try again.' },
      { status: 500 }
    )
  }
}

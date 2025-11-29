// Send OTP API Route
// POST /api/auth/send-otp - Send email verification OTP

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateOTP, getOTPExpiry } from '@/lib/auth/otp'
import { sendEmail } from '@/lib/email/mailer'
import { getOTPEmail } from '@/lib/email/templates'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/auth/rate-limit'
import prisma from '@/lib/db/prisma'

const sendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent OTP spam
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(`send-otp:${clientId}`, RATE_LIMITS.API)

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
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
    const validatedData = sendOTPSchema.parse(body)

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

    // Generate OTP
    const otp = generateOTP()
    const otpExpiresAt = getOTPExpiry(10) // 10 minutes

    // Save OTP to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOTP: otp,
        otpExpiresAt,
      },
    })

    // Send OTP email
    const otpEmail = getOTPEmail(otp, 10)
    await sendEmail({
      to: user.email,
      subject: otpEmail.subject,
      html: otpEmail.html,
    })

    return NextResponse.json(
      {
        message: 'Verification code sent to your email',
        expiresIn: 600, // 10 minutes in seconds
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Send OTP error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    )
  }
}

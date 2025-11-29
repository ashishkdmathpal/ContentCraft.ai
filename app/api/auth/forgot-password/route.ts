// Forgot Password API Route
// POST /api/auth/forgot-password - Send password reset email

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateResetToken, getResetTokenExpiry } from '@/lib/auth/otp'
import { sendEmail } from '@/lib/email/mailer'
import { getPasswordResetEmail } from '@/lib/email/templates'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/auth/rate-limit'
import prisma from '@/lib/db/prisma'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(`forgot-password:${clientId}`, RATE_LIMITS.API)

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
    const validatedData = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    })

    // Always return success (don't reveal if email exists for security)
    const successMessage = 'If an account with that email exists, a password reset link has been sent.'

    if (!user) {
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const resetTokenExpiresAt = getResetTokenExpiry(30) // 30 minutes

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiresAt,
      },
    })

    // Send password reset email
    const resetEmail = getPasswordResetEmail(resetToken, 30)
    await sendEmail({
      to: user.email,
      subject: resetEmail.subject,
      html: resetEmail.html,
    })

    return NextResponse.json(
      { message: successMessage },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}

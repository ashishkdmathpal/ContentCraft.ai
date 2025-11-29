// Reset Password API Route
// POST /api/auth/reset-password - Reset password using token

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth/password'
import { isExpired } from '@/lib/auth/otp'
import { sendEmail } from '@/lib/email/mailer'
import { getPasswordChangedEmail } from '@/lib/email/templates'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/auth/rate-limit'
import prisma from '@/lib/db/prisma'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(`reset-password:${clientId}`, RATE_LIMITS.API)

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
    const validatedData = resetPasswordSchema.parse(body)

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { resetToken: validatedData.token },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (isExpired(user.resetTokenExpiresAt)) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(validatedData.password)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    })

    // Invalidate all existing sessions (force re-login)
    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    // Send password changed confirmation email
    const changedEmail = getPasswordChangedEmail(user.name || '')
    sendEmail({
      to: user.email,
      subject: changedEmail.subject,
      html: changedEmail.html,
    }).catch((err) => console.error('Failed to send password changed email:', err))

    return NextResponse.json(
      { message: 'Password reset successfully. Please login with your new password.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)

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

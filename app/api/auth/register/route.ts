// Registration API Route
// POST /api/auth/register - Create new user account

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth/password'
import { generateTokenPair } from '@/lib/auth/jwt'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/auth/rate-limit'
import prisma from '@/lib/db/prisma'

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent spam registrations
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(`register:${clientId}`, RATE_LIMITS.REGISTER)

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Too many registration attempts. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMITS.REGISTER.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user and default tenant in transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email.toLowerCase(),
          passwordHash,
          name: validatedData.name,
        },
      })

      // Create default tenant for user
      const tenant = await tx.tenant.create({
        data: {
          name: `${newUser.name || newUser.email}'s Workspace`,
          slug: `user-${newUser.id}`,
          ownerId: newUser.id,
          plan: 'FREE',
        },
      })

      // Add user as owner of tenant
      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: newUser.id,
          role: 'OWNER',
        },
      })

      return newUser
    })

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
    })

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      },
    })

    // Return success
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tokens,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

// User Tenant API Route
// GET /api/user/tenant - Get user's default tenant

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import prisma from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user's owned tenant (default tenant created during registration)
    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: payload.userId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
      },
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'No tenant found for user' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { tenant },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user tenant error:', error)

    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}

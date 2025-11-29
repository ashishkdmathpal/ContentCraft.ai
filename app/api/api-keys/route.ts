// API Keys Management Route
// GET /api/api-keys - List user's API keys
// POST /api/api-keys - Add new API key

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { encrypt } from '@/lib/auth/encryption'
import prisma from '@/lib/db/prisma'

const addApiKeySchema = z.object({
  provider: z.enum([
    'OPENAI',
    'ANTHROPIC',
    'GOOGLE_AI',
    'FAL_AI',
    'REPLICATE',
    'STABILITY_AI',
    'DATAFORSEO',
    'SERPAPI',
    'LINKEDIN',
    'FACEBOOK',
    'INSTAGRAM',
    'TWITTER_X',
    'TIKTOK',
  ]),
  apiKey: z.string().min(1, 'API key is required'),
  label: z.string().min(1).max(100).optional(),
})

// GET /api/api-keys - List all user's API keys (masked)
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

    // Get user's API keys
    const apiKeys = await prisma.userApiKey.findMany({
      where: { userId: payload.userId },
      select: {
        id: true,
        provider: true,
        label: true,
        isValid: true,
        lastUsedAt: true,
        createdAt: true,
        // Do NOT return encryptedKey
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      { apiKeys },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get API keys error:', error)

    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST /api/api-keys - Add new API key
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = addApiKeySchema.parse(body)

    // Check if API key already exists for this provider
    const existingKey = await prisma.userApiKey.findUnique({
      where: {
        userId_provider: {
          userId: payload.userId,
          provider: validatedData.provider,
        },
      },
    })

    if (existingKey) {
      return NextResponse.json(
        { error: `You already have an API key for ${validatedData.provider}. Delete the existing one first.` },
        { status: 400 }
      )
    }

    // Encrypt the API key
    const encryptedKey = encrypt(validatedData.apiKey)

    // Save to database
    const apiKey = await prisma.userApiKey.create({
      data: {
        userId: payload.userId,
        provider: validatedData.provider,
        encryptedKey,
        label: validatedData.label,
      },
      select: {
        id: true,
        provider: true,
        label: true,
        isValid: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'API key added successfully',
        apiKey,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Add API key error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add API key' },
      { status: 500 }
    )
  }
}

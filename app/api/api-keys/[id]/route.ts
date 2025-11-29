// API Key Details Route
// PUT /api/api-keys/[id] - Update API key (label, validity)
// DELETE /api/api-keys/[id] - Delete API key

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAccessToken } from '@/lib/auth/jwt'
import prisma from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const updateApiKeySchema = z.object({
  label: z.string().min(1).max(100).optional(),
  isValid: z.boolean().optional(),
})

// PUT /api/api-keys/[id] - Update API key label or validity
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

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
    const validatedData = updateApiKeySchema.parse(body)

    // Check if API key exists and belongs to user
    const existingKey = await prisma.userApiKey.findUnique({
      where: {
        id,
        userId: payload.userId,
      },
    })

    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    // Update API key
    const updatedKey = await prisma.userApiKey.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        provider: true,
        label: true,
        isValid: true,
        lastUsedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'API key updated successfully',
        apiKey: updatedKey,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update API key error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    )
  }
}

// DELETE /api/api-keys/[id] - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

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

    // Check if API key exists and belongs to user
    const existingKey = await prisma.userApiKey.findUnique({
      where: {
        id,
        userId: payload.userId,
      },
    })

    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    // Delete API key
    await prisma.userApiKey.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'API key deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete API key error:', error)

    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    )
  }
}

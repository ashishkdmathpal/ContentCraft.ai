// Post Management API Route
// GET /api/posts/[id] - Get post details
// PUT /api/posts/[id] - Update post content
// DELETE /api/posts/[id] - Delete post

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAccessToken } from '@/lib/auth/jwt'
import prisma from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const updatePostSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'ARCHIVED']).optional(),
})

// GET /api/posts/[id] - Get post details
export async function GET(
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

    // Get post with tenant check
    const post = await prisma.post.findFirst({
      where: {
        id,
        tenant: {
          ownerId: payload.userId,
        },
      },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { post },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get post error:', error)

    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[id] - Update post
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
    const validatedData = updatePostSchema.parse(body)

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findFirst({
      where: {
        id,
        tenant: {
          ownerId: payload.userId,
        },
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(
      {
        message: 'Post updated successfully',
        post: updatedPost,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update post error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete post
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

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findFirst({
      where: {
        id,
        tenant: {
          ownerId: payload.userId,
        },
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Delete post
    await prisma.post.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete post error:', error)

    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}

// Conversation Details API Route
// GET /api/conversations/[id] - Get conversation with messages
// DELETE /api/conversations/[id] - Delete conversation

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import prisma from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/conversations/[id] - Get conversation with all messages
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

    // Get conversation with messages
    const conversation = await prisma.conversation.findUnique({
      where: {
        id,
        userId: payload.userId, // Ensure user owns this conversation
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Format messages
    const formattedMessages = conversation.messages.map((msg) => ({
      id: msg.id,
      role: msg.role.toLowerCase(),
      content: msg.content,
      timestamp: msg.createdAt,
      metadata: msg.metadata,
      tokensUsed: msg.tokensInput && msg.tokensOutput
        ? msg.tokensInput + msg.tokensOutput
        : undefined,
    }))

    return NextResponse.json(
      {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          messages: formattedMessages,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get conversation error:', error)

    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

// DELETE /api/conversations/[id] - Delete conversation
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

    // Check if conversation exists and belongs to user
    const conversation = await prisma.conversation.findUnique({
      where: {
        id,
        userId: payload.userId,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Delete conversation (messages will be deleted due to cascade)
    await prisma.conversation.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Conversation deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete conversation error:', error)

    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}

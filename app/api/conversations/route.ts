// Conversations API Route
// GET /api/conversations - List user's conversations
// POST /api/conversations - Create new conversation

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAccessToken } from '@/lib/auth/jwt'
import prisma from '@/lib/db/prisma'

const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  tenantId: z.string().cuid(),
})

// GET /api/conversations - List all conversations for user
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

    // Get user's conversations with last message
    const conversations = await prisma.conversation.findMany({
      where: { userId: payload.userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Transform response
    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title || 'New Conversation',
      lastMessage: conv.messages[0]?.content?.substring(0, 100),
      messageCount: conv._count.messages,
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt,
    }))

    return NextResponse.json(
      { conversations: formattedConversations },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get conversations error:', error)

    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/conversations - Create new conversation
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
    const validatedData = createConversationSchema.parse(body)

    // For now, use a default tenant ID (will be replaced with actual tenant logic)
    // In Phase 3, we'll implement proper multi-tenancy
    const defaultTenantId = validatedData.tenantId

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: payload.userId,
        tenantId: defaultTenantId,
        title: validatedData.title || 'New Conversation',
      },
    })

    return NextResponse.json(
      {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create conversation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

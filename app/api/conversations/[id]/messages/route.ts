// Conversation Messages API Route
// POST /api/conversations/[id]/messages - Send message and get AI response

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAccessToken } from '@/lib/auth/jwt'
import prisma from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
})

// POST /api/conversations/[id]/messages - Send user message and get AI response
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: conversationId } = await params

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
    const validatedData = sendMessageSchema.parse(body)

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId: payload.userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 messages for context
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'USER',
        content: validatedData.content,
      },
    })

    // TODO: Replace with real OpenAI API call in next step
    // For now, return a placeholder AI response
    const aiResponseContent = `I'm ContentCraft AI! I can help you generate social media content.

Try asking me to:
• Create a LinkedIn post about [topic]
• Generate a Facebook post about [topic]
• Write a Tweet about [topic]

First, you'll need to add your OpenAI API key in Settings.`

    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiResponseContent,
        model: 'placeholder', // Will be replaced with actual model
        tokensInput: 0,
        tokensOutput: 0,
      },
    })

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Return both messages
    return NextResponse.json(
      {
        userMessage: {
          id: userMessage.id,
          role: 'user',
          content: userMessage.content,
          timestamp: userMessage.createdAt,
        },
        aiMessage: {
          id: aiMessage.id,
          role: 'assistant',
          content: aiMessage.content,
          timestamp: aiMessage.createdAt,
          tokensUsed: 0,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Send message error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

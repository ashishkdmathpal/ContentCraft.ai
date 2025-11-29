// Conversation Messages API Route
// POST /api/conversations/[id]/messages - Send message and get AI response with streaming

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getOpenAIClient, getChatCompletion, updateApiKeyUsage, type ChatMessage } from '@/lib/ai/openai'
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

    // Get OpenAI client
    const openai = await getOpenAIClient(payload.userId)

    if (!openai) {
      // No API key configured - return helpful message
      const aiMessage = await prisma.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: `I see you haven't added an OpenAI API key yet. To use AI content generation:

1. Click "Manage API Keys" on the dashboard
2. Add your OpenAI API key
3. Come back and start chatting!

You can get an API key from: https://platform.openai.com/api-keys`,
          model: null,
          tokensInput: 0,
          tokensOutput: 0,
        },
      })

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })

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
    }

    // Build conversation history for context
    const conversationHistory: ChatMessage[] = [
      {
        role: 'system',
        content: `You are ContentCraft AI, a helpful assistant specialized in creating social media content. You help users generate:
- LinkedIn posts (professional, engaging, with hashtags)
- Facebook posts (conversational, community-focused)
- Tweets/X posts (concise, under 280 characters, with hashtags)
- Instagram captions (visual-focused, with emojis and hashtags)

Always format the content professionally and include relevant hashtags.`,
      },
      // Add recent conversation history (reversed to chronological order)
      ...conversation.messages
        .slice()
        .reverse()
        .map((msg) => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
        })),
      // Add current user message
      {
        role: 'user' as const,
        content: validatedData.content,
      },
    ]

    // Get AI response (non-streaming for now - will add streaming later)
    const aiResponse = await getChatCompletion(openai, conversationHistory, 'gpt-4o-mini')

    // Save AI message
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiResponse.content,
        model: 'gpt-4o-mini',
        tokensInput: aiResponse.tokensInput,
        tokensOutput: aiResponse.tokensOutput,
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Update API key last used timestamp
    await updateApiKeyUsage(payload.userId, 'OPENAI')

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
          tokensUsed: aiResponse.tokensInput + aiResponse.tokensOutput,
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

    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your API key in Settings.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

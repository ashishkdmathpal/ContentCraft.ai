// Conversation Messages API Route
// POST /api/conversations/[id]/messages - Send message and get AI response with streaming

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getOpenAIClient, getChatCompletion, updateApiKeyUsage, type ChatMessage } from '@/lib/ai/openai'
import { parseIntent, isContentGeneration, getPlatformName } from '@/lib/ai/intent-parser'
import { getContentPrompt, getChatSystemPrompt } from '@/lib/ai/prompts'
import prisma from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
})

/**
 * Extract hashtags from generated content
 */
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g
  const matches = content.match(hashtagRegex)
  return matches ? matches.map((tag) => tag.slice(1)) : []
}

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

    // Parse user intent
    const intent = parseIntent(validatedData.content)
    const isGenerating = isContentGeneration(intent)

    // Build system prompt based on intent
    let systemPrompt: string
    if (isGenerating && intent.topic && intent.platform) {
      const contentPrompt = getContentPrompt(intent.platform, intent.topic)
      systemPrompt = contentPrompt.systemPrompt
      console.log(`[ContentGen] Platform: ${getPlatformName(intent.platform)}, Topic: ${intent.topic}`)
    } else {
      systemPrompt = getChatSystemPrompt()
    }

    // Build conversation history for context
    const conversationHistory: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      // Add recent conversation history (reversed to chronological order)
      ...conversation.messages
        .slice()
        .reverse()
        .map((msg) => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
        })),
      // Add current user message (optionally with enhanced prompt for content generation)
      {
        role: 'user' as const,
        content:
          isGenerating && intent.topic && intent.platform
            ? getContentPrompt(intent.platform, intent.topic).userPromptTemplate
            : validatedData.content,
      },
    ]

    // Get AI response
    const aiResponse = await getChatCompletion(openai, conversationHistory, 'gpt-4o-mini')

    // Save generated content as Post if this was a content generation request
    let postId: string | undefined
    if (isGenerating && intent.platform && intent.topic) {
      try {
        // Map intent platform to Post platform
        const platformMap: Record<string, string> = {
          LINKEDIN: 'LINKEDIN_PERSONAL',
          FACEBOOK: 'FACEBOOK_PAGE',
          TWITTER: 'TWITTER_X',
          INSTAGRAM: 'INSTAGRAM_BUSINESS',
        }

        const post = await prisma.post.create({
          data: {
            tenantId: conversation.tenantId,
            content: aiResponse.content,
            contentType: 'SOCIAL_POST',
            platform: intent.platform !== 'GENERAL' ? platformMap[intent.platform] : null,
            status: 'DRAFT',
            conversationId,
            aiModel: 'gpt-4o-mini',
            promptUsed: validatedData.content,
            tokensUsed: aiResponse.tokensInput + aiResponse.tokensOutput,
            keywords: [intent.topic],
            hashtags: extractHashtags(aiResponse.content),
          },
        })

        postId = post.id
        console.log(`[ContentGen] Saved post ${post.id} for ${getPlatformName(intent.platform)}`)
      } catch (error) {
        console.error('Failed to save post:', error)
        // Don't fail the entire request if post saving fails
      }
    }

    // Save AI message
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiResponse.content,
        model: 'gpt-4o-mini',
        tokensInput: aiResponse.tokensInput,
        tokensOutput: aiResponse.tokensOutput,
        metadata: postId ? { postId } : null,
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
          postId,
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

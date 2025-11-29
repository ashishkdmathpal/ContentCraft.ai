// OpenAI Client Wrapper
// Handles API key decryption and chat completions with streaming

import OpenAI from 'openai'
import { decrypt } from '@/lib/auth/encryption'
import prisma from '@/lib/db/prisma'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamChunk {
  content: string
  done: boolean
}

/**
 * Get user's OpenAI API key and create client
 */
export async function getOpenAIClient(userId: string): Promise<OpenAI | null> {
  try {
    // Get user's OpenAI API key
    const apiKey = await prisma.userApiKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'OPENAI',
        },
      },
      select: {
        encryptedKey: true,
        isValid: true,
      },
    })

    if (!apiKey || !apiKey.isValid) {
      return null
    }

    // Decrypt API key
    const decryptedKey = decrypt(apiKey.encryptedKey)

    // Create OpenAI client
    const client = new OpenAI({
      apiKey: decryptedKey,
    })

    return client
  } catch (error) {
    console.error('Failed to get OpenAI client:', error)
    return null
  }
}

/**
 * Stream chat completion from OpenAI
 */
export async function streamChatCompletion(
  client: OpenAI,
  messages: ChatMessage[],
  model: string = 'gpt-4o-mini'
): Promise<AsyncIterable<StreamChunk>> {
  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2000,
  })

  // Convert OpenAI stream to our StreamChunk format
  async function* generateChunks(): AsyncIterable<StreamChunk> {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      const done = chunk.choices[0]?.finish_reason !== null

      yield {
        content,
        done,
      }
    }
  }

  return generateChunks()
}

/**
 * Get non-streaming chat completion (for testing)
 */
export async function getChatCompletion(
  client: OpenAI,
  messages: ChatMessage[],
  model: string = 'gpt-4o-mini'
): Promise<{ content: string; tokensInput: number; tokensOutput: number }> {
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  })

  return {
    content: response.choices[0]?.message?.content || '',
    tokensInput: response.usage?.prompt_tokens || 0,
    tokensOutput: response.usage?.completion_tokens || 0,
  }
}

/**
 * Update API key's last used timestamp
 */
export async function updateApiKeyUsage(userId: string, provider: string): Promise<void> {
  try {
    await prisma.userApiKey.update({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      data: {
        lastUsedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to update API key usage:', error)
  }
}

// Intent Parser
// Detects user intent for content generation commands

export type SocialPlatform = 'LINKEDIN' | 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'GENERAL'

export interface ContentIntent {
  action: 'generate' | 'edit' | 'chat'
  platform?: SocialPlatform
  topic?: string
  additionalContext?: string
}

/**
 * Parse user message to detect content generation intent
 */
export function parseIntent(userMessage: string): ContentIntent {
  const message = userMessage.toLowerCase()

  // Check for content generation keywords
  const generateKeywords = [
    'create',
    'generate',
    'write',
    'draft',
    'make',
    'compose',
    'build',
  ]

  const isGenerateAction = generateKeywords.some((keyword) =>
    message.includes(keyword)
  )

  // Detect platform
  let platform: SocialPlatform = 'GENERAL'

  if (message.includes('linkedin')) {
    platform = 'LINKEDIN'
  } else if (message.includes('facebook') || message.includes('fb')) {
    platform = 'FACEBOOK'
  } else if (message.includes('twitter') || message.includes('tweet') || message.includes(' x ')) {
    platform = 'TWITTER'
  } else if (message.includes('instagram') || message.includes('insta') || message.includes('ig')) {
    platform = 'INSTAGRAM'
  }

  // Extract topic (simplified - looks for "about X")
  let topic: string | undefined
  const aboutMatch = message.match(/about\s+(.+?)(?:\s+for|\s+on|\s+with|$)/i)
  if (aboutMatch && aboutMatch[1]) {
    topic = aboutMatch[1].trim()
  }

  // Determine action
  const action: ContentIntent['action'] = isGenerateAction ? 'generate' : 'chat'

  return {
    action,
    platform: action === 'generate' ? platform : undefined,
    topic,
    additionalContext: userMessage,
  }
}

/**
 * Check if intent is for content generation
 */
export function isContentGeneration(intent: ContentIntent): boolean {
  return intent.action === 'generate'
}

/**
 * Get platform name for display
 */
export function getPlatformName(platform: SocialPlatform): string {
  const names: Record<SocialPlatform, string> = {
    LINKEDIN: 'LinkedIn',
    FACEBOOK: 'Facebook',
    TWITTER: 'X (Twitter)',
    INSTAGRAM: 'Instagram',
    GENERAL: 'Social Media',
  }
  return names[platform]
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Key, Plus, Trash2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'

interface ApiKey {
  id: string
  provider: string
  label?: string
  isValid: boolean
  lastUsedAt?: string
  createdAt: string
}

const PROVIDER_LABELS: Record<string, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE_AI: 'Google AI',
  FAL_AI: 'Fal.ai',
  REPLICATE: 'Replicate',
  STABILITY_AI: 'Stability AI',
  DATAFORSEO: 'DataForSEO',
  SERPAPI: 'SerpAPI',
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TWITTER_X: 'X (Twitter)',
  TIKTOK: 'TikTok',
}

const AI_PROVIDERS = ['OPENAI', 'ANTHROPIC', 'GOOGLE_AI']
const IMAGE_PROVIDERS = ['FAL_AI', 'REPLICATE', 'STABILITY_AI']
const SEO_PROVIDERS = ['DATAFORSEO', 'SERPAPI']
const SOCIAL_PROVIDERS = ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'TWITTER_X', 'TIKTOK']

export default function ApiKeysPage() {
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [label, setLabel] = useState('')

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest<{ apiKeys: ApiKey[] }>('/api/api-keys')
      setApiKeys(response.apiKeys)
    } catch (error) {
      console.error('Failed to load API keys:', error)
      setError('Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddKey = async () => {
    if (!selectedProvider || !apiKeyValue) {
      setError('Please select a provider and enter an API key')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      await apiRequest('/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeyValue,
          label: label || undefined,
        }),
      })

      // Reset form and close dialog
      setSelectedProvider('')
      setApiKeyValue('')
      setLabel('')
      setIsAddDialogOpen(false)

      // Reload API keys
      await loadApiKeys()
    } catch (error: unknown) {
      console.error('Failed to add API key:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to add API key')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      await apiRequest(`/api/api-keys/${id}`, {
        method: 'DELETE',
      })

      // Reload API keys
      await loadApiKeys()
    } catch (error) {
      console.error('Failed to delete API key:', error)
      setError('Failed to delete API key')
    }
  }

  const getProviderBadgeColor = (provider: string) => {
    if (AI_PROVIDERS.includes(provider)) return 'bg-purple-500/10 text-purple-500'
    if (IMAGE_PROVIDERS.includes(provider)) return 'bg-blue-500/10 text-blue-500'
    if (SEO_PROVIDERS.includes(provider)) return 'bg-green-500/10 text-green-500'
    if (SOCIAL_PROVIDERS.includes(provider)) return 'bg-orange-500/10 text-orange-500'
    return 'bg-gray-500/10 text-gray-500'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Key className="h-8 w-8" />
                API Keys
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your API keys for AI models, image generation, and social platforms
              </p>
            </div>

            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* API Keys List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <Card className="p-12 text-center">
            <Key className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No API keys yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first API key to start using AI content generation
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <Card key={key.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getProviderBadgeColor(key.provider)}`}>
                        {PROVIDER_LABELS[key.provider] || key.provider}
                      </span>
                      {!key.isValid && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                          Invalid
                        </span>
                      )}
                    </div>

                    {key.label && (
                      <p className="text-sm font-medium mb-1">{key.label}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Added {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                      {key.lastUsedAt && (
                        <span>
                          Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add API Key Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
            <DialogDescription>
              Add an API key for AI models, image generation, or social platforms
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Provider Select */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    AI Models
                  </div>
                  {AI_PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {PROVIDER_LABELS[provider]}
                    </SelectItem>
                  ))}

                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                    Image Generation
                  </div>
                  {IMAGE_PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {PROVIDER_LABELS[provider]}
                    </SelectItem>
                  ))}

                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                    SEO & Research
                  </div>
                  {SEO_PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {PROVIDER_LABELS[provider]}
                    </SelectItem>
                  ))}

                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                    Social Platforms
                  </div>
                  {SOCIAL_PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {PROVIDER_LABELS[provider]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Label Input */}
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Production Key"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddKey} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add API Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

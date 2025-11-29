'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Plus, Settings, User, Sparkles, Menu, Edit2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiRequest, getDefaultTenantId } from '@/lib/api/client'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  postId?: string
}

interface Conversation {
  id: string
  title: string
  lastMessage?: string
  messageCount?: number
  updatedAt: Date
}

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check authentication and load user data
  useEffect(() => {
    const loadUser = async () => {
      const accessToken = localStorage.getItem('accessToken')

      if (!accessToken) {
        router.push('/login')
        return
      }

      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        setUser({
          email: payload.email,
          name: payload.name,
        })

        // Fetch user's default tenant
        const tenant = await getDefaultTenantId()
        setTenantId(tenant)
      } catch (error) {
        console.error('Failed to load user:', error)
        router.push('/login')
      }
    }

    loadUser()
  }, [router])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversations from API
  useEffect(() => {
    if (!tenantId) return

    const loadConversations = async () => {
      try {
        setIsLoading(true)
        const response = await apiRequest<{ conversations: Conversation[] }>(
          '/api/conversations'
        )

        if (response.conversations.length > 0) {
          setConversations(response.conversations)
          setCurrentConversation(response.conversations[0].id)
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [tenantId])

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversation) return

    const loadMessages = async () => {
      try {
        setIsLoading(true)
        const response = await apiRequest<{
          conversation: {
            id: string
            title: string
            messages: Message[]
          }
        }>(`/api/conversations/${currentConversation}`)

        setMessages(
          response.conversation.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        )
      } catch (error) {
        console.error('Failed to load messages:', error)
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [currentConversation])

  const handleSend = async () => {
    if (!input.trim() || isSending || !currentConversation) return

    const userContent = input
    setInput('')
    setIsSending(true)

    // Optimistically add user message to UI
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      // Send message to API
      const response = await apiRequest<{
        userMessage: Message
        aiMessage: Message
      }>(`/api/conversations/${currentConversation}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: userContent }),
      })

      // Replace temp message with actual messages from server
      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => msg.id !== tempUserMessage.id)
        return [
          ...withoutTemp,
          {
            ...response.userMessage,
            timestamp: new Date(response.userMessage.timestamp),
          },
          {
            ...response.aiMessage,
            timestamp: new Date(response.aiMessage.timestamp),
          },
        ]
      })

      // Update conversation list (move to top)
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === currentConversation
            ? { ...conv, lastMessage: userContent, updatedAt: new Date() }
            : conv
        )
        return updated.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id))
      // TODO: Show error toast
    } finally {
      setIsSending(false)
    }
  }

  const handleNewConversation = async () => {
    if (!tenantId) return

    try {
      const response = await apiRequest<{
        conversation: Conversation
      }>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Conversation',
          tenantId,
        }),
      })

      const newConv = {
        ...response.conversation,
        updatedAt: new Date(response.conversation.updatedAt),
      }

      setConversations((prev) => [newConv, ...prev])
      setCurrentConversation(newConv.id)
      setMessages([])
    } catch (error) {
      console.error('Failed to create conversation:', error)
      // TODO: Show error toast
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/login')
  }

  const handleEditPost = (postId: string, content: string) => {
    setEditingPostId(postId)
    setEditedContent(content)
  }

  const handleCancelEdit = () => {
    setEditingPostId(null)
    setEditedContent('')
  }

  const handleSaveEdit = async (postId: string) => {
    if (!editedContent.trim()) return

    try {
      await apiRequest(`/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editedContent }),
      })

      // Update message content in UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.postId === postId ? { ...msg, content: editedContent } : msg
        )
      )

      setEditingPostId(null)
      setEditedContent('')
    } catch (error) {
      console.error('Failed to update post:', error)
      // TODO: Show error toast
    }
  }

  if (!user || !tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r bg-muted/10 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Conversations</h2>
            <Button variant="ghost" size="icon" onClick={handleNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setCurrentConversation(conv.id)}
              className={cn(
                'w-full p-4 text-left hover:bg-muted/50 transition-colors border-b',
                currentConversation === conv.id && 'bg-muted'
              )}
            >
              <div className="font-medium text-sm truncate">{conv.title}</div>
              {conv.lastMessage && (
                <div className="text-xs text-muted-foreground truncate mt-1">
                  {conv.lastMessage}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push('/dashboard')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <User className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">ContentCraft AI</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.name || user.email}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Welcome to ContentCraft AI</h2>
              <p className="text-muted-foreground max-w-md">
                Start a conversation to generate social media content, blog articles, and more using
                AI.
              </p>
              <div className="mt-6 space-y-2 text-left">
                <p className="text-sm font-medium">Try asking me to:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create a LinkedIn post about AI in marketing</li>
                  <li>• Generate a Facebook post about our new product</li>
                  <li>• Write a Twitter thread about startup growth</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn('flex gap-3', message.role === 'user' && 'justify-end')}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <Card
                    className={cn(
                      'p-4 max-w-[80%] sm:max-w-[70%] relative group',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {editingPostId === message.postId ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[100px] text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(message.postId!)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        {message.postId && message.role === 'assistant' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEditPost(message.postId!, message.content)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </>
                    )}
                  </Card>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="p-4 bg-muted">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                    </div>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending || !currentConversation}
              className="flex-1"
            />
            <Button type="submit" disabled={isSending || !input.trim() || !currentConversation}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

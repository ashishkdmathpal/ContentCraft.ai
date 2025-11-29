'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    // Mounting flag to prevent SSR/CSR mismatch
    const mount = () => setMounted(true)
    mount()
  }, [])

  useEffect(() => {
    // Check authentication and load user
    const loadUser = () => {
      const accessToken = localStorage.getItem('accessToken')

      if (!accessToken) {
        setError('No authentication token found. Please login.')
        localStorage.removeItem('refreshToken')
        setTimeout(() => router.push('/login'), 1500)
        return
      }

      // Decode and validate JWT token
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]))

        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          setError('Your session has expired. Please login again.')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        // Token is valid, set user
        setUser({
          email: payload.email,
          name: payload.name,
        })
      } catch (err) {
        console.error('Invalid token:', err)
        setError('Invalid authentication token. Please login again.')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    loadUser()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    router.push('/login')
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">ContentCraft AI</h1>
          <div className="flex items-center gap-4">
            {mounted && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back{user.name ? `, ${user.name}` : ''}!</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation</CardTitle>
              <CardDescription>Create social media posts with AI</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push('/chat')}>
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
              <CardDescription>Schedule and publish to social media</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blog</CardTitle>
              <CardDescription>Manage your blog and articles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Keywords</CardTitle>
              <CardDescription>Research keywords for your content</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Image Generation</CardTitle>
              <CardDescription>Create AI images for your posts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Manage your account and API keys</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push('/settings/api-keys')}>
                Manage API Keys
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🚀 Phase 2: Chat & AI Generation</CardTitle>
            <CardDescription>In Progress - 40% Complete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>✅ Chat interface UI built</p>
            <p>✅ Conversation database logic complete</p>
            <p>✅ API key management system ready</p>
            <p>⏳ Next: OpenAI integration with streaming responses</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

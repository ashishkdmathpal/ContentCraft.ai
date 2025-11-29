import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Zap, Calendar, Image as ImageIcon, TrendingUp, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-2xl font-bold">ContentCraft AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">
          AI-Powered Content Generation
          <br />
          <span className="text-primary">For Social Media</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Generate, schedule, and publish engaging content across all your social platforms.
          Self-hosted, open-source, and privacy-first.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Start Free Trial
            </Button>
          </Link>
          <Link href="https://github.com/ashishkdmathpal/ContentCraft.ai" target="_blank">
            <Button size="lg" variant="outline" className="text-lg px-8">
              View on GitHub
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Sparkles className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>AI Content Generation</CardTitle>
              <CardDescription>
                Generate engaging posts using GPT-4, Claude, or your preferred AI model
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Smart Scheduling</CardTitle>
              <CardDescription>
                Schedule posts across multiple platforms with automated publishing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <ImageIcon className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>AI Image Generation</CardTitle>
              <CardDescription>
                Create stunning visuals with DALL-E, Stable Diffusion, or FLUX
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>SEO Optimization</CardTitle>
              <CardDescription>
                Research keywords and optimize content for maximum reach
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Multi-Platform Publishing</CardTitle>
              <CardDescription>
                Publish to LinkedIn, Twitter, Facebook, and more from one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Self-Hosted & Secure</CardTitle>
              <CardDescription>
                Own your data with full control over your content and API keys
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-muted/50 rounded-lg">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-4">1</div>
            <h4 className="text-xl font-semibold mb-2">Chat with AI</h4>
            <p className="text-muted-foreground">
              Describe what content you want in plain English
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-4">2</div>
            <h4 className="text-xl font-semibold mb-2">Review & Edit</h4>
            <p className="text-muted-foreground">
              AI generates content that you can customize and refine
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-4">3</div>
            <h4 className="text-xl font-semibold mb-2">Publish & Schedule</h4>
            <p className="text-muted-foreground">
              Publish now or schedule for optimal engagement times
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-4xl font-bold mb-6">Ready to Get Started?</h3>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join creators and marketers who are saving hours every week with AI-powered content generation.
        </p>
        <Link href="/register">
          <Button size="lg" className="text-lg px-8">
            Create Free Account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 ContentCraft AI. Open-source under AGPL-3.0 License.</p>
          <div className="flex gap-6 justify-center mt-4">
            <Link href="https://github.com/ashishkdmathpal/ContentCraft.ai" className="hover:text-foreground">
              GitHub
            </Link>
            <Link href="/docs" className="hover:text-foreground">
              Documentation
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Test Email API Route (Development Only)
// GET /api/auth/test-email - Test email configuration

import { NextResponse } from 'next/server'
import { verifyEmailConfig, sendEmail } from '@/lib/email/mailer'

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    // Verify email configuration
    const isConfigValid = await verifyEmailConfig()

    if (!isConfigValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email configuration is invalid. Please check your .env file.',
        },
        { status: 500 }
      )
    }

    // Send test email
    await sendEmail({
      to: process.env.EMAIL_USER || '',
      subject: 'ContentCraft AI - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #667eea;">Email Configuration Test</h1>
          <p>This is a test email from ContentCraft AI.</p>
          <p>If you're seeing this, your email configuration is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Time: ${new Date().toISOString()}<br>
            Environment: ${process.env.NODE_ENV}
          </p>
        </div>
      `,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Test email sent successfully!',
        to: process.env.EMAIL_USER,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Test email error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

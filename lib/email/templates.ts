// Email Templates
// HTML email templates for different notification types

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
`

const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
`

const headerStyle = `
  text-align: center;
  padding: 30px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px 10px 0 0;
`

const contentStyle = `
  padding: 40px 30px;
  background-color: #f9fafb;
`

const buttonStyle = `
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin: 20px 0;
`

const footerStyle = `
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: #666;
  background-color: #f9fafb;
  border-radius: 0 0 10px 10px;
`

const otpCodeStyle = `
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 8px;
  color: #667eea;
  background-color: #f3f4f6;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin: 30px 0;
  font-family: 'Courier New', monospace;
`

/**
 * Welcome email template
 */
export function getWelcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to ContentCraft AI! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">Welcome to ContentCraft AI!</h1>
            </div>

            <div style="${contentStyle}">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${name || 'there'}! 👋</h2>

              <p style="font-size: 16px;">
                Thank you for joining ContentCraft AI - your AI-powered content creation and marketing platform!
              </p>

              <p style="font-size: 16px;">
                We're excited to have you on board. Here's what you can do:
              </p>

              <ul style="font-size: 16px; line-height: 2;">
                <li>✨ Generate AI-powered content for social media</li>
                <li>📅 Schedule and publish to multiple platforms</li>
                <li>📊 Research and optimize SEO keywords</li>
                <li>🎨 Create AI-generated images</li>
                <li>📝 Manage your blog and articles</li>
              </ul>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="${buttonStyle}">
                  Get Started
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/docs" style="color: #667eea;">documentation</a> or reply to this email.
              </p>
            </div>

            <div style="${footerStyle}">
              <p style="margin: 5px 0;">ContentCraft AI - AI-Powered Content Creation</p>
              <p style="margin: 5px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea; text-decoration: none;">Visit Website</a> |
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" style="color: #667eea; text-decoration: none;">Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

/**
 * OTP verification email template
 */
export function getOTPEmail(otp: string, expiresInMinutes: number = 10): { subject: string; html: string } {
  return {
    subject: 'Your ContentCraft AI Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">Verification Code</h1>
            </div>

            <div style="${contentStyle}">
              <p style="font-size: 16px;">
                Use the following code to verify your email address:
              </p>

              <div style="${otpCodeStyle}">
                ${otp}
              </div>

              <p style="font-size: 14px; color: #666; text-align: center;">
                This code will expire in ${expiresInMinutes} minutes.
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>⚠️ Security Notice:</strong> Never share this code with anyone. ContentCraft AI will never ask for your verification code.
                </p>
              </div>

              <p style="font-size: 14px; color: #666;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>

            <div style="${footerStyle}">
              <p style="margin: 5px 0;">ContentCraft AI - AI-Powered Content Creation</p>
              <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

/**
 * Password reset email template
 */
export function getPasswordResetEmail(resetToken: string, expiresInMinutes: number = 30): { subject: string; html: string } {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

  return {
    subject: 'Reset Your ContentCraft AI Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
            </div>

            <div style="${contentStyle}">
              <p style="font-size: 16px;">
                You requested to reset your password for your ContentCraft AI account.
              </p>

              <p style="font-size: 16px;">
                Click the button below to reset your password:
              </p>

              <div style="text-align: center;">
                <a href="${resetUrl}" style="${buttonStyle}">
                  Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
                This link will expire in ${expiresInMinutes} minutes.
              </p>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
                ${resetUrl}
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </p>
              </div>
            </div>

            <div style="${footerStyle}">
              <p style="margin: 5px 0;">ContentCraft AI - AI-Powered Content Creation</p>
              <p style="margin: 5px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea; text-decoration: none;">Visit Website</a> |
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" style="color: #667eea; text-decoration: none;">Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

/**
 * Password changed confirmation email
 */
export function getPasswordChangedEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Your ContentCraft AI Password Was Changed',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="margin: 0; font-size: 28px;">Password Changed</h1>
            </div>

            <div style="${contentStyle}">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${name || 'there'}!</h2>

              <p style="font-size: 16px;">
                This is a confirmation that your ContentCraft AI password was successfully changed.
              </p>

              <p style="font-size: 16px;">
                If you made this change, you can safely ignore this email.
              </p>

              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #991b1b;">
                  <strong>⚠️ Security Alert:</strong> If you did NOT make this change, please contact our support team immediately.
                </p>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" style="${buttonStyle}">
                  Contact Support
                </a>
              </div>
            </div>

            <div style="${footerStyle}">
              <p style="margin: 5px 0;">ContentCraft AI - AI-Powered Content Creation</p>
              <p style="margin: 5px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea; text-decoration: none;">Visit Website</a> |
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" style="color: #667eea; text-decoration: none;">Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

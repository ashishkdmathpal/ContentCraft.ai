// Email Service using Nodemailer
// Handles all email sending functionality

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Email configuration from environment variables
const config = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // false for TLS (587), true for SSL (465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: {
    email: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    name: process.env.EMAIL_FROM_NAME || 'ContentCraft AI',
  },
}

// Create transporter
let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    if (!config.auth.user || !config.auth.pass) {
      throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env')
    }

    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    })
  }

  return transporter
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = getTransporter()

    await transporter.sendMail({
      from: `${config.from.name} <${config.from.email}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    console.log(`✅ Email sent to: ${options.to}`)
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    throw new Error('Failed to send email')
  }
}

/**
 * Verify email configuration (useful for testing)
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = getTransporter()
    await transporter.verify()
    console.log('✅ Email server connection verified')
    return true
  } catch (error) {
    console.error('❌ Email server connection failed:', error)
    return false
  }
}

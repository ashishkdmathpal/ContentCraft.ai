// Authentication Middleware
// Verify JWT tokens and protect routes

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from './jwt'

export async function authMiddleware(request: NextRequest) {
  // Get token from Authorization header
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
  }

  // Verify token
  const payload = verifyAccessToken(token)

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized - Invalid or expired token' }, { status: 401 })
  }

  // Add user info to request headers for use in route handlers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId)
  requestHeaders.set('x-user-email', payload.email)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Helper to get user from request headers in API routes
export function getUserFromHeaders(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    email: request.headers.get('x-user-email'),
  }
}

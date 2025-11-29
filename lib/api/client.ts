// API Client Utilities
// Helper functions for making authenticated API requests

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: unknown
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

/**
 * Make authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken()

  if (!token) {
    throw new ApiError('No authentication token found', 401)
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')

  const response = await fetch(endpoint, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
      data.details
    )
  }

  return data
}

/**
 * Get user's default tenant ID
 */
export async function getDefaultTenantId(): Promise<string> {
  const response = await apiRequest<{ tenant: { id: string } }>(
    '/api/user/tenant'
  )
  return response.tenant.id
}

/**
 * Get the appropriate redirect URL for auth callbacks based on the current environment
 */
export function getAuthRedirectUrl(path: string = '/auth/callback'): string {
  // Check if we're on the client side
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`
  }
  
  // Server side - use environment variables or defaults
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    return `http://localhost:3000${path}`
  }
  
  // Production - try to get from environment variable first
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  
  if (siteUrl) {
    // Ensure protocol is included
    const url = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
    return `${url}${path}`
  }
  
  // Fallback - this shouldn't happen in production
  return `https://yourdomain.com${path}`
}

/**
 * Get the appropriate site URL based on the current environment
 */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    return 'http://localhost:3000'
  }
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  
  if (siteUrl) {
    return siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  }
  
  return 'https://yourdomain.com'
}

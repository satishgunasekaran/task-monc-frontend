import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_code = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  // Handle OAuth provider errors first
  if (error_code) {
    console.error('OAuth Error:', error_code, error_description)
    const errorParams = new URLSearchParams({
      error: error_code,
      description: error_description || 'Authentication failed'
    })
    return NextResponse.redirect(`${origin}/login/error?${errorParams}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Success - redirect to the intended destination
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      // Handle specific Supabase auth errors
      console.error('Supabase Auth Error:', error)
      let errorMessage = 'Authentication failed'
      
      if (error?.message.includes('expired')) {
        errorMessage = 'The confirmation link has expired. Please request a new one.'
      } else if (error?.message.includes('invalid')) {
        errorMessage = 'The confirmation link is invalid or has already been used.'
      } else if (error?.message.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please try again later.'
      } else if (error) {
        errorMessage = error.message
      }
      
      const errorParams = new URLSearchParams({
        error: 'auth_error',
        description: errorMessage
      })
      return NextResponse.redirect(`${origin}/login/error?${errorParams}`)
    }
  }

  // No code provided - invalid request
  const errorParams = new URLSearchParams({
    error: 'invalid_request',
    description: 'No authorization code provided'
  })
  return NextResponse.redirect(`${origin}/login/error?${errorParams}`)
}

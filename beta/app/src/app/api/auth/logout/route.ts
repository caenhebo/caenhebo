import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  // Get all cookies
  const cookieStore = await cookies()
  
  // Create response that redirects to signin page
  const response = NextResponse.redirect('http://95.179.170.56:3019/auth/signin')
  
  // Clear all possible cookie names that NextAuth might use
  const cookiesToClear = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token', 
    '__Secure-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
  ]

  // Clear each cookie with all possible configurations
  cookiesToClear.forEach(cookieName => {
    // Clear with different path and domain configurations
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    })
    
    // Also try to delete the cookie
    response.cookies.delete(cookieName)
  })
  
  // Also clear any cookies that exist in the request
  cookieStore.getAll().forEach(cookie => {
    if (cookie.name.includes('next-auth') || cookie.name.includes('auth')) {
      response.cookies.delete(cookie.name)
    }
  })

  // Add cache control headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

export async function POST(req: NextRequest) {
  return GET(req)
}
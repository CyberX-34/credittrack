import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public paths
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // API Authentication logic could go here if needed, 
  // but we'll protect APIs within the route handlers themselves for finer control,
  // or protect /api/admin and /api/student globally here.
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isStudentRoute = pathname.startsWith('/student') || pathname.startsWith('/api/student')

  if (isAdminRoute || isStudentRoute) {
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(token, getSecretKey())
      const role = payload.role as string

      if (isAdminRoute && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/student', request.url))
      }

      if (isStudentRoute && role !== 'STUDENT') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      return NextResponse.next()
    } catch (error) {
      // Invalid token
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth_token')
      return response
    }
  }

  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}

import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: { userId: string; role: string; username?: string | null; email?: string | null }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // 24 hours
    .sign(getSecretKey())
  return token
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as { userId: string; role: string; username?: string | null; email?: string | null }
  } catch (error) {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) return null
  
  return await verifyToken(token)
}

import { createRemoteJWKSet } from 'jose'

const googleJWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export interface GoogleJWTPayload {
  email?: string;
  sub?: string;
  aud?: string | string[];
  [key: string]: any;
}

export async function verifyGoogleToken(credential: string): Promise<GoogleJWTPayload | null> {
  try {
    const audiences = [process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_ID].filter(Boolean) as string[]
    
    if (audiences.length === 0) {
      throw new Error('CRITICAL SECURITY MISCONFIGURATION: Google Client IDs are not set in environment variables. Refusing to verify tokens without an audience check.')
    }

    const { payload } = await jwtVerify(credential, googleJWKS, {
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
      audience: audiences,
    })
    return payload as GoogleJWTPayload
  } catch (error) {
    console.error('Google token verification failed:', error)
    return null
  }
}

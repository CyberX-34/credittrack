import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: { userId: string; role: string; username: string }) {
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
    return payload as { userId: string; role: string; username: string }
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

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.authProvider !== 'LOCAL' || !user.password_hash) {
      return NextResponse.json({ error: 'Please login using your original method (e.g. Google)' }, { status: 400 })
    }

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - new Date().getTime()) / 60000)
      return NextResponse.json({ error: `Account locked due to too many failed attempts. Try again in ${waitMinutes} minutes.` }, { status: 403 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      const failedAttempts = user.failedLoginAttempts + 1
      let lockedUntil = null
      if (failedAttempts >= 5) {
        lockedUntil = new Date(new Date().getTime() + 15 * 60000) // 15 mins lock
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failedAttempts, lockedUntil }
      })

      if (lockedUntil) {
        return NextResponse.json({ error: 'Account locked due to too many failed attempts. Try again in 15 minutes.' }, { status: 403 })
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null }
      })
    }

    if (user.status === 'PENDING') {
      return NextResponse.json({ error: 'Your account is pending admin approval' }, { status: 403 })
    }
    
    if (user.status === 'REJECTED') {
      return NextResponse.json({ error: 'Your registration was not approved. Contact an administrator.' }, { status: 403 })
    }

    const token = await signToken({
      userId: user.id,
      role: user.role,
      username: user.username,
    })

    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

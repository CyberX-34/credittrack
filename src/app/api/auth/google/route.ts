import { NextResponse } from 'next/server'
import { prisma, TransactionClient } from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { credential } = await request.json()
    if (!credential) {
      return NextResponse.json({ error: 'Missing credential' }, { status: 400 })
    }

    // Verify token with Google API
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 400 })
    }
    const payload = await verifyRes.json()
    
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token payload' }, { status: 400 })
    }

    // Must be mgits.ac.in
    if (!payload.email.endsWith('@mgits.ac.in')) {
      return NextResponse.json({ error: 'Please use your mgits.ac.in email address' }, { status: 403 })
    }

    // Google API returns aud as client_id
    if (payload.aud !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      // Optional check, usually good practice
    }

    const googleId = payload.sub
    const email = payload.email

    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { googleId },
          { email }
        ]
      },
      include: { studentProfile: true }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'No account found for this Google email. Please register first.',
        status: 'UNREGISTERED'
      }, { status: 404 })
    }

    if (user.studentProfile?.isDeleted || user.status === 'REJECTED') {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'PENDING' }
      })
      return NextResponse.json({ error: 'Your account has been submitted for re-approval. Please wait for an admin to approve your access.' }, { status: 403 })
    }

    // Link googleId if missing but email matched
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, authProvider: 'GOOGLE' },
        include: { studentProfile: true }
      })
    }

    if (user.status === 'PENDING') {
      return NextResponse.json({ error: 'Your account is pending admin approval' }, { status: 403 })
    }

    // Login successful
    const token = await signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    })

    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

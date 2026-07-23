import { NextResponse } from 'next/server'
import { prisma, TransactionClient } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, rollNo, branch, year, credential } = data

    if (!name || !rollNo || !branch || !year || !credential) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

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

    const googleId = payload.sub
    const email = payload.email

    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { googleId },
          { email }
        ]
      },
      include: { studentProfile: true }
    })
    
    if (existingUser) {
      if (existingUser.studentProfile?.isDeleted || existingUser.status === 'REJECTED') {
        // They were deleted or rejected previously, let them retry and go back to PENDING.
        // We update their profile with the new submitted data and reset status.
        await prisma.$transaction(async (tx: TransactionClient) => {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { status: 'PENDING' }
          })
          if (existingUser.studentProfile) {
            await tx.studentProfile.update({
              where: { id: existingUser.studentProfile.id },
              data: { name, rollNo, branch, year: parseInt(year) }
            })
          }
        })
        return NextResponse.json({ message: 'Registration resubmitted! Please wait for admin approval.', status: 'PENDING' }, { status: 200 })
      }
      return NextResponse.json({ error: 'A Google account with this email is already registered. Please login.' }, { status: 400 })
    }

    const existingStudent = await prisma.studentProfile.findUnique({ where: { rollNo } })
    if (existingStudent) {
      return NextResponse.json({ error: 'Roll number already exists' }, { status: 400 })
    }

    const newStudent = await prisma.$transaction(async (tx: TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          googleId,
          authProvider: 'GOOGLE',
          role: 'STUDENT',
          status: 'PENDING',
          studentProfile: {
            create: {
              name,
              rollNo,
              branch,
              year: parseInt(year)
            }
          }
        },
        include: {
          studentProfile: true
        }
      })
      
      return user.studentProfile
    })

    return NextResponse.json({ message: 'Registration submitted! Please wait for admin approval.', status: 'PENDING' }, { status: 201 })
  } catch (error) {
    console.error('Failed to register student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma, TransactionClient } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, rollNo, branch, year, username, password } = data

    if (!name || !rollNo || !branch || !year || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    // Explicitly check for existing username and rollNo before insert
    const existingUser = await prisma.user.findUnique({ where: { username } })
    const existingStudent = await prisma.studentProfile.findUnique({ where: { rollNo } })
    
    if (existingUser || existingStudent) {
      return NextResponse.json({ error: 'Username or Roll number is already registered' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const newStudent = await prisma.$transaction(async (tx: TransactionClient) => {
      const user = await tx.user.create({
        data: {
          username,
          password_hash,
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
      return user
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Your account is pending admin approval.'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

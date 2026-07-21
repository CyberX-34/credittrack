import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcrypt'

// Get all students
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const students = await prisma.studentProfile.findMany({
      include: {
        user: {
          select: { username: true, createdAt: true }
        }
      },
      orderBy: { totalCredits: 'desc' }
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Failed to fetch students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create a new student
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { name, rollNo, branch, year, username, password } = data

    if (!name || !rollNo || !branch || !year || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Check if user or rollNo already exists
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    }

    const existingStudent = await prisma.studentProfile.findUnique({ where: { rollNo } })
    if (existingStudent) {
      return NextResponse.json({ error: 'Roll number already exists' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const newStudent = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          username,
          password_hash,
          role: 'STUDENT',
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
      
      // Log activity
      const adminProfile = await tx.adminProfile.findUnique({ where: { userId: session.userId } })
      if (adminProfile) {
        await tx.activityLog.create({
          data: {
            action: 'CREATE_STUDENT',
            performedById: adminProfile.id,
            details: JSON.stringify({ studentId: user.studentProfile!.id, rollNo })
          }
        })
      }

      return user.studentProfile
    })

    return NextResponse.json(newStudent, { status: 201 })
  } catch (error) {
    console.error('Failed to create student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma, TransactionClient } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcrypt'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentAdmin = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })

    const admins = await prisma.adminProfile.findMany({
      where: { isDeleted: false },
      include: {
        user: {
          select: { username: true, createdAt: true, status: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      admins,
      currentUser: currentAdmin ? { id: currentAdmin.id, isSuperAdmin: currentAdmin.isSuperAdmin } : null
    })
  } catch (error) {
    console.error('Failed to fetch admins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    let { name, username, password } = data
    
    if (typeof username === 'string') {
      username = username.trim()
    }

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'Name, username, and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const newAdmin = await prisma.$transaction(async (tx: TransactionClient) => {
      const user = await tx.user.create({
        data: {
          username,
          password_hash,
          role: 'ADMIN',
          status: 'APPROVED',
          adminProfile: {
            create: {
              name
            }
          }
        },
        include: {
          adminProfile: true
        }
      })
      return user
    })

    return NextResponse.json(newAdmin)
  } catch (error: any) {
    console.error('Admin creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId, newPassword } = await request.json()
    if (!studentId || !newPassword) {
      return NextResponse.json({ error: 'Student ID and new password are required' }, { status: 400 })
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    
    if (student.user.authProvider === 'GOOGLE') {
      return NextResponse.json({ error: 'Cannot reset password for Google Auth accounts' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: student.userId },
      data: { password_hash, failedLoginAttempts: 0, lockedUntil: null }
    })

    // Log the activity
    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    if (adminProfile) {
      await prisma.activityLog.create({
        data: {
          action: 'RESET_PASSWORD',
          performedById: adminProfile.id,
          details: JSON.stringify({ studentId, rollNo: student.rollNo, name: student.name })
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reset password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma, TransactionClient } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { studentId, sessionId, date } = data

    if (!studentId || !sessionId || !date) {
      return NextResponse.json({ error: 'studentId, sessionId, and date are required' }, { status: 400 })
    }

    // Normalize date to start of day
    const normalizedDate = new Date(date)
    normalizedDate.setUTCHours(0, 0, 0, 0)

    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    if (!adminProfile) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 })
    }

    // Check if attendance already exists to prevent duplicate error crashing the transaction
    const existing = await prisma.attendanceLog.findUnique({
      where: {
        studentId_sessionId_date: {
          studentId,
          sessionId,
          date: normalizedDate
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Attendance already recorded for this session' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const log = await tx.attendanceLog.create({
        data: {
          studentId,
          sessionId,
          date: normalizedDate,
          creditedById: adminProfile.id
        }
      })

      const updatedStudent = await tx.studentProfile.update({
        where: { id: studentId },
        data: { totalCredits: { increment: 1 } }
      })

      await tx.activityLog.create({
        data: {
          action: 'AWARD_ATTENDANCE',
          performedById: adminProfile.id,
          details: JSON.stringify({ studentId, sessionId, date: normalizedDate, pointsAdded: 1 })
        }
      })
      
      await tx.notification.create({
        data: {
          studentId,
          message: `You earned 1 credit for attendance (${sessionId})`
        }
      })

      return { log, totalCredits: updatedStudent.totalCredits }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Failed to record attendance:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Attendance already recorded for this session' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

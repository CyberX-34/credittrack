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
    const { type, id } = data // type: 'ATTENDANCE' | 'RESULT'

    if (!type || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 })
    }

    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    if (!adminProfile) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      if (type === 'ATTENDANCE') {
        const log = await tx.attendanceLog.findUnique({ where: { id } })
        if (!log || log.isReversed) {
          throw new Error('Record not found or already reversed')
        }

        await tx.attendanceLog.update({
          where: { id },
          data: { isReversed: true }
        })

        await tx.studentProfile.update({
          where: { id: log.studentId },
          data: { totalCredits: { decrement: 1 } }
        })

        await tx.activityLog.create({
          data: {
            action: 'REVERSE_ATTENDANCE',
            performedById: adminProfile.id,
            details: JSON.stringify({ attendanceId: id, studentId: log.studentId, pointsDeducted: 1 })
          }
        })

        return { success: true }
      } else if (type === 'RESULT') {
        const eventResult = await tx.eventResult.findUnique({ 
          where: { id },
          include: { team: { include: { members: true } } }
        })
        if (!eventResult || eventResult.isReversed) {
          throw new Error('Record not found or already reversed')
        }

        await tx.eventResult.update({
          where: { id },
          data: { isReversed: true }
        })

        let affectedStudentIds: string[] = []

        if (eventResult.studentId) {
          affectedStudentIds.push(eventResult.studentId)
          await tx.studentProfile.update({
            where: { id: eventResult.studentId },
            data: { totalCredits: { decrement: eventResult.pointsAwarded } }
          })
        } else if (eventResult.team) {
          affectedStudentIds = eventResult.team.members.map(m => m.studentId)
          for (const sId of affectedStudentIds) {
            await tx.studentProfile.update({
              where: { id: sId },
              data: { totalCredits: { decrement: eventResult.pointsAwarded } }
            })
          }
        }

        await tx.activityLog.create({
          data: {
            action: 'REVERSE_RESULT',
            performedById: adminProfile.id,
            details: JSON.stringify({ resultId: id, eventId: eventResult.eventId, affectedStudentIds, pointsDeducted: eventResult.pointsAwarded })
          }
        })

        return { success: true }
      } else {
        throw new Error('Invalid correction type')
      }
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Failed to correct record:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

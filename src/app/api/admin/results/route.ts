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
    // EventResult validity — enforce exactly one of studentId / teamMemberIds is set
    const { eventId, position, pointsAwarded, studentId, teamMemberIds, teamName } = data

    if (!eventId || pointsAwarded === undefined) {
      return NextResponse.json({ error: 'eventId and pointsAwarded are required' }, { status: 400 })
    }

    const hasStudent = !!studentId
    const hasTeam = Array.isArray(teamMemberIds) && teamMemberIds.length > 0

    if (hasStudent && hasTeam) {
      return NextResponse.json({ error: 'Cannot assign result to both a single student and a team simultaneously' }, { status: 400 })
    }

    if (!hasStudent && !hasTeam) {
      return NextResponse.json({ error: 'Must assign result to either a student or a team' }, { status: 400 })
    }

    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    if (!adminProfile) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 })
    }

    // Check unique position if it's not null (participation)
    if (position !== null) {
      const existing = await prisma.eventResult.findUnique({
        where: {
          eventId_position: { eventId, position }
        }
      })
      if (existing) {
        return NextResponse.json({ error: `Position ${position} is already assigned for this event` }, { status: 400 })
      }
    }

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      let eventResult
      let affectedStudentIds: string[] = []

      if (hasStudent) {
        eventResult = await tx.eventResult.create({
          data: {
            eventId,
            position,
            pointsAwarded,
            studentId
          }
        })
        affectedStudentIds.push(studentId)

        await tx.studentProfile.update({
          where: { id: studentId },
          data: { totalCredits: { increment: pointsAwarded } }
        })
      } else {
        // Create the Team
        const team = await tx.team.create({
          data: {
            eventId,
            teamName,
            members: {
              create: teamMemberIds.map((id: string) => ({
                student: { connect: { id } }
              }))
            }
          }
        })

        eventResult = await tx.eventResult.create({
          data: {
            eventId,
            position,
            pointsAwarded,
            teamId: team.id
          }
        })

        affectedStudentIds = teamMemberIds

        // Fan out points
        for (const id of teamMemberIds) {
          await tx.studentProfile.update({
            where: { id },
            data: { totalCredits: { increment: pointsAwarded } }
          })
        }
      }

      await tx.activityLog.create({
        data: {
          action: 'RECORD_RESULT',
          performedById: adminProfile.id,
          details: JSON.stringify({ 
            eventId, 
            position, 
            pointsAwarded, 
            affectedStudentIds 
          })
        }
      })

      const event = await tx.event.findUnique({ where: { id: eventId } })
      const posString = position ? `${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} place` : 'participation'
      const message = `You earned ${pointsAwarded} credits for ${posString} in ${event?.name || 'an event'}`

      for (const id of affectedStudentIds) {
        await tx.notification.create({
          data: {
            studentId: id,
            message
          }
        })
      }

      return eventResult
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Failed to record result:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This position is already assigned for this event' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

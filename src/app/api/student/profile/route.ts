import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: {
        correctionRequests: {
          where: { status: 'PENDING' }
        },
        attendanceLogs: {
          where: { isReversed: false },
          orderBy: { date: 'desc' }
        },
        soloResults: {
          where: { isReversed: false },
          include: { event: true },
          orderBy: { event: { date: 'desc' } }
        },
        teams: {
          include: {
            team: {
              include: {
                event: true,
                result: true
              }
            }
          }
        },
        notifications: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Process team results, filtering reversed ones
    const groupResults = studentProfile.teams
      .filter(t => t.team.result && !t.team.result.isReversed)
      .map(t => ({
        ...t.team.result,
        event: t.team.event,
        teamName: t.team.teamName
      }))

    // Calculate dynamic badges based on history
    const badges = []
    if (studentProfile.attendanceLogs.length >= 1) badges.push({ id: 'first_attendance', name: 'First Class', type: 'bronze' })
    if (studentProfile.attendanceLogs.length >= 5) badges.push({ id: 'attendance_5', name: '5x Streak', type: 'silver' })
    if (studentProfile.soloResults.length > 0 || groupResults.length > 0) badges.push({ id: 'first_win', name: 'First Win', type: 'gold' })
    
    // Sort all results for timeline
    const allEvents = [
      ...studentProfile.soloResults.map(r => ({ ...r, eventType: 'SOLO' })),
      ...groupResults.map(r => ({ ...r, eventType: 'GROUP' }))
    ].sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime())

    // Also get rank
    const allStudents = await prisma.studentProfile.findMany({
      orderBy: { totalCredits: 'desc' },
      select: { id: true, totalCredits: true }
    })
    
    const rank = allStudents.findIndex(s => s.id === studentProfile.id) + 1

    return NextResponse.json({
      profile: {
        id: studentProfile.id,
        name: studentProfile.name,
        rollNo: studentProfile.rollNo,
        branch: studentProfile.branch,
        year: studentProfile.year,
        totalCredits: studentProfile.totalCredits,
      },
      rank,
      badges,
      history: allEvents,
      attendanceCount: studentProfile.attendanceLogs.length,
      notifications: studentProfile.notifications
    })
  } catch (error) {
    console.error('Failed to fetch student profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

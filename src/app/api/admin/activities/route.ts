import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activities = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      include: { admin: true },
      take: 100 // Get latest 100
    })
    
    // Also fetch non-reversed attendances and results for the correction UI
    const attendances = await prisma.attendanceLog.findMany({
      where: { isReversed: false },
      include: { student: true },
      orderBy: { date: 'desc' },
      take: 50
    })
    
    const results = await prisma.eventResult.findMany({
      where: { isReversed: false },
      include: {
        event: true,
        student: true,
        team: { include: { members: { include: { student: true } } } }
      },
      orderBy: { event: { date: 'desc' } },
      take: 50
    })

    return NextResponse.json({ activities, attendances, results })
  } catch (error) {
    console.error('Failed to fetch activity logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

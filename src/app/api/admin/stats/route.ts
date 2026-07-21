import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalStudents = await prisma.studentProfile.count()
    const totalEvents = await prisma.event.count()
    const totalCreditsAwarded = await prisma.studentProfile.aggregate({
      _sum: { totalCredits: true }
    })
    const recentActivity = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: { admin: true }
    })

    return NextResponse.json({
      totalStudents,
      totalEvents,
      totalCreditsAwarded: totalCreditsAwarded._sum.totalCredits || 0,
      recentActivity
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

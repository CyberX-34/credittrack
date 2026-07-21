import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationIds } = await request.json()

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'notificationIds array is required' }, { status: 400 })
    }

    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: session.userId } })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        studentId: studentProfile.id
      },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Failed to mark notifications read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

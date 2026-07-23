import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requests = await prisma.profileCorrectionRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            branch: true,
            year: true,
            user: { select: { username: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Failed to fetch correction requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

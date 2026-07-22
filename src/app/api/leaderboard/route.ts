import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const students = await prisma.studentProfile.findMany({
      where: {
        isDeleted: false,
        user: { status: 'APPROVED' }
      },
      orderBy: { totalCredits: 'desc' },
      select: {
        id: true,
        name: true,
        branch: true,
        year: true,
        totalCredits: true
      }
    })

    return NextResponse.json(students, { status: 200 })
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

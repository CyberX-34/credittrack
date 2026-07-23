import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, rollNo, branch, year } = await request.json()

    if (!name || !rollNo || !branch || !year) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.userId },
      include: {
        correctionRequests: {
          where: { status: 'PENDING' }
        }
      }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (studentProfile.correctionRequests.length > 0) {
      return NextResponse.json({ error: 'You already have a pending correction request.' }, { status: 400 })
    }

    // Check if new rollNo exists and belongs to someone else
    if (rollNo !== studentProfile.rollNo) {
      const existing = await prisma.studentProfile.findUnique({ where: { rollNo } })
      if (existing) {
        return NextResponse.json({ error: 'Roll number already in use' }, { status: 400 })
      }
    }

    const correctionRequest = await prisma.profileCorrectionRequest.create({
      data: {
        studentId: studentProfile.id,
        proposedName: name,
        proposedRollNo: rollNo,
        proposedBranch: branch,
        proposedYear: parseInt(year),
        status: 'PENDING'
      }
    })

    return NextResponse.json({ message: 'Correction request submitted for approval.', request: correctionRequest })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

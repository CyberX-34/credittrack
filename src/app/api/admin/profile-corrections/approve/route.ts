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
    const { requestId, action, name, rollNo, branch, year } = data // action: 'approve' | 'reject'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
    }

    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    if (!adminProfile) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 })
    }

    const correctionRequest = await prisma.profileCorrectionRequest.findUnique({ 
      where: { id: requestId },
      include: { student: true }
    })
    
    if (!correctionRequest || correctionRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Pending request not found' }, { status: 404 })
    }

    // Check for roll number conflicts if approving and the roll number has changed from original
    if (action === 'approve' && rollNo && rollNo !== correctionRequest.student.rollNo) {
      const existing = await prisma.studentProfile.findUnique({ where: { rollNo } })
      if (existing) {
        return NextResponse.json({ error: 'Roll number already exists for another student' }, { status: 400 })
      }
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Mark request as processed
      await tx.profileCorrectionRequest.update({
        where: { id: requestId },
        data: { status: newStatus }
      })

      // If approved, update the student profile
      if (action === 'approve' && name && rollNo && branch && year) {
        await tx.studentProfile.update({
          where: { id: correctionRequest.studentId },
          data: { name, rollNo, branch, year: parseInt(year) }
        })

        // Log the activity
        await tx.activityLog.create({
          data: {
            action: 'APPROVE_PROFILE_CORRECTION',
            performedById: adminProfile.id,
            details: JSON.stringify({ 
              studentId: correctionRequest.studentId, 
              requestId, 
              updates: { name, rollNo, branch, year }
            })
          }
        })
      }

      return { success: true }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Profile correction approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

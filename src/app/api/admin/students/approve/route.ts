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
    const { studentId, action, name, rollNo, branch, year } = data // action: 'approve' | 'reject'

    if (!studentId || !action) {
      return NextResponse.json({ error: 'studentId and action are required' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
    }

    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    if (!adminProfile) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 })
    }

    const studentProfile = await prisma.studentProfile.findUnique({ where: { id: studentId } })
    if (!studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (rollNo && rollNo !== studentProfile.rollNo) {
      const existing = await prisma.studentProfile.findUnique({ where: { rollNo } })
      if (existing) {
        return NextResponse.json({ error: 'Roll number already exists for another student' }, { status: 400 })
      }
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.user.update({
        where: { id: studentProfile.userId },
        data: { status: newStatus }
      })

      if (name && rollNo && branch && year) {
        await tx.studentProfile.update({
          where: { id: studentProfile.id },
          data: { 
            name, 
            rollNo, 
            branch, 
            year: parseInt(year), 
            ...(action === 'approve' ? { isDeleted: false } : {})
          }
        })
      } else if (action === 'approve') {
        await tx.studentProfile.update({
          where: { id: studentProfile.id },
          data: { isDeleted: false }
        })
      }

      await tx.activityLog.create({
        data: {
          action: action === 'approve' ? 'APPROVE_STUDENT' : 'REJECT_STUDENT',
          performedById: adminProfile.id,
          details: JSON.stringify({ studentId, decision: newStatus })
        }
      })
      return { success: true }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params

    // Soft delete the student
    const updatedStudent = await prisma.studentProfile.update({
      where: { id: studentId },
      data: { isDeleted: true },
      include: { user: true }
    })

    // Also mark the User as rejected or simply leave it as is since isDeleted handles visibility,
    // but blocking login makes sense. We'll set User status to REJECTED so they can't login via LOCAL either.
    await prisma.user.update({
      where: { id: updatedStudent.userId },
      data: { status: 'REJECTED' }
    })

    // Log the activity
    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    if (adminProfile) {
      await prisma.activityLog.create({
        data: {
          action: 'DELETE_STUDENT',
          performedById: adminProfile.id,
          details: JSON.stringify({ studentId, rollNo: updatedStudent.rollNo, name: updatedStudent.name })
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params
    const { name, rollNo, branch, year } = await request.json()

    if (!name || !rollNo || !branch || !year) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const studentProfile = await prisma.studentProfile.findUnique({ where: { id: studentId } })
    if (!studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (rollNo !== studentProfile.rollNo) {
      const existing = await prisma.studentProfile.findUnique({ where: { rollNo } })
      if (existing) {
        return NextResponse.json({ error: 'Roll number already exists' }, { status: 400 })
      }
    }

    await prisma.studentProfile.update({
      where: { id: studentId },
      data: { name, rollNo, branch, year: parseInt(year) }
    })

    const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    if (adminProfile) {
      await prisma.activityLog.create({
        data: {
          action: 'UPDATE_STUDENT',
          performedById: adminProfile.id,
          details: JSON.stringify({ studentId, updates: { name, rollNo, branch, year } })
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

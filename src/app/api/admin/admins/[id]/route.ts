import { NextRequest, NextResponse } from 'next/server'
import { prisma, TransactionClient } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcrypt'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: targetAdminId } = await params
    
    const requesterAdmin = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    
    if (!requesterAdmin || !requesterAdmin.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: Superadmin privileges required' }, { status: 403 })
    }

    if (requesterAdmin.id === targetAdminId) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 })
    }

    const targetAdmin = await prisma.adminProfile.findUnique({ where: { id: targetAdminId } })
    if (!targetAdmin || targetAdmin.isDeleted) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Safety check: Don't delete the last active superadmin
    if (targetAdmin.isSuperAdmin) {
      const activeSuperAdminsCount = await prisma.adminProfile.count({
        where: { isSuperAdmin: true, isDeleted: false }
      })
      if (activeSuperAdminsCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last active superadmin' }, { status: 400 })
      }
    }

    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.adminProfile.update({
        where: { id: targetAdminId },
        data: { isDeleted: true }
      })

      await tx.user.update({
        where: { id: targetAdmin.userId },
        data: { status: 'REJECTED' }
      })

      await tx.activityLog.create({
        data: {
          action: 'DELETE_ADMIN',
          performedById: requesterAdmin.id,
          details: JSON.stringify({ deletedAdminId: targetAdminId, name: targetAdmin.name })
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: targetAdminId } = await params
    const { newPassword } = await request.json()

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    const requesterAdmin = await prisma.adminProfile.findUnique({ where: { userId: session.userId } })
    
    if (!requesterAdmin || !requesterAdmin.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: Superadmin privileges required' }, { status: 403 })
    }

    if (requesterAdmin.id === targetAdminId) {
      return NextResponse.json({ error: 'Please use your own profile settings to change your password' }, { status: 400 })
    }

    const targetAdmin = await prisma.adminProfile.findUnique({ where: { id: targetAdminId } })
    if (!targetAdmin || targetAdmin.isDeleted) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    const password_hash = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.user.update({
        where: { id: targetAdmin.userId },
        data: { password_hash }
      })

      await tx.activityLog.create({
        data: {
          action: 'RESET_ADMIN_PASSWORD',
          performedById: requesterAdmin.id,
          details: JSON.stringify({ targetAdminId, name: targetAdmin.name })
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin password reset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

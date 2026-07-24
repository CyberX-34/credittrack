import { NextRequest, NextResponse } from 'next/server'
import { prisma, TransactionClient } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { adminProfile: true }
    })

    if (!user || !user.adminProfile || !user.password_hash) {
      return NextResponse.json({ error: 'Admin account not found or invalid' }, { status: 404 })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password_hash }
      })

      await tx.activityLog.create({
        data: {
          action: 'CHANGE_OWN_PASSWORD',
          performedById: user.adminProfile!.id,
          details: JSON.stringify({ message: 'Admin changed their own password' })
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

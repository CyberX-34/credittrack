import { NextResponse } from 'next/server'
import { prisma, TransactionClient } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { name, date, type, description } = data

    if (!name || !date || !type) {
      return NextResponse.json({ error: 'Name, date, and type are required' }, { status: 400 })
    }

    const newEvent = await prisma.$transaction(async (tx: TransactionClient) => {
      const event = await tx.event.create({
        data: {
          name,
          date: new Date(date),
          type,
          description
        }
      })
      
      const adminProfile = await tx.adminProfile.findUnique({ where: { userId: session.userId } })
      if (adminProfile) {
        await tx.activityLog.create({
          data: {
            action: 'CREATE_EVENT',
            performedById: adminProfile.id,
            details: JSON.stringify({ eventId: event.id, name })
          }
        })
      }

      return event
    })

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    console.error('Failed to create event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

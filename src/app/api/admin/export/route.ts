import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { stringify } from 'csv-stringify/sync'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'students', 'events', 'leaderboard'

    let data: any[] = []
    let filename = 'export.csv'

    if (type === 'students') {
      const students = await prisma.studentProfile.findMany({
        include: { user: true }
      })
      data = students.map(s => ({
        ID: s.id,
        Username: s.user.username,
        Name: s.name,
        RollNo: s.rollNo,
        Branch: s.branch,
        Year: s.year,
        TotalCredits: s.totalCredits
      }))
      filename = 'students_export.csv'
    } else if (type === 'events') {
      const events = await prisma.event.findMany()
      data = events.map(e => ({
        ID: e.id,
        Name: e.name,
        Date: new Date(e.date).toISOString().split('T')[0],
        Type: e.type,
        Description: e.description || ''
      }))
      filename = 'events_export.csv'
    } else if (type === 'leaderboard') {
      const students = await prisma.studentProfile.findMany({
        orderBy: { totalCredits: 'desc' }
      })
      data = students.map((s, index) => ({
        Rank: index + 1,
        Name: s.name,
        Branch: s.branch,
        Year: s.year,
        TotalCredits: s.totalCredits
      }))
      filename = 'leaderboard_export.csv'
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 })
    }

    const csvOutput = stringify(data, { header: true })

    return new NextResponse(csvOutput, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Failed to export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

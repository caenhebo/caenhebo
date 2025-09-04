import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { interviewDate } = await request.json()

    if (!interviewDate) {
      return NextResponse.json({ error: 'Interview date is required' }, { status: 400 })
    }

    // Update property with interview date
    const property = await prisma.property.update({
      where: { id },
      data: {
        interviewDate: new Date(interviewDate),
        interviewStatus: 'SCHEDULED',
        updatedAt: new Date()
      }
    })

    // TODO: Send email notification to seller about interview

    return NextResponse.json({ 
      success: true, 
      property,
      message: 'Interview scheduled successfully' 
    })
  } catch (error) {
    console.error('Error scheduling interview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { notes } = await request.json()

    // Update interview notes
    const property = await prisma.property.update({
      where: { id },
      data: {
        interviewNotes: notes,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      property,
      message: 'Interview notes saved' 
    })
  } catch (error) {
    console.error('Error saving interview notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
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
    const { notes, status } = await request.json()

    if (status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update property with interview completion
    const property = await prisma.property.update({
      where: { id },
      data: {
        interviewStatus: 'COMPLETED',
        interviewNotes: notes,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      property,
      message: 'Interview marked as completed' 
    })
  } catch (error) {
    console.error('Error completing interview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
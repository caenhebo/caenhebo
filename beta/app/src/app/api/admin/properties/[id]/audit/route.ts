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
    const { notes } = await request.json()

    if (!notes) {
      return NextResponse.json({ error: 'Audit notes are required' }, { status: 400 })
    }

    // Create audit record
    const audit = await prisma.propertyAudit.create({
      data: {
        propertyId: id,
        adminId: session.user.id,
        notes,
        createdAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      audit,
      message: 'Audit record created successfully' 
    })
  } catch (error) {
    console.error('Error creating audit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const audits = await prisma.propertyAudit.findMany({
      where: { propertyId: id },
      include: {
        admin: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ audits })
  } catch (error) {
    console.error('Error fetching audits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
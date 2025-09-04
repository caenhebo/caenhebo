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
    const { status } = await request.json()

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get current property data first
    const currentProperty = await prisma.property.findUnique({
      where: { id }
    })

    if (!currentProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Update the final approval status
    const property = await prisma.property.update({
      where: { id },
      data: {
        finalApprovalStatus: status,
        // If rejecting at final stage, add note but don't reset other statuses
        complianceNotes: status === 'REJECTED' 
          ? `${currentProperty.complianceNotes || ''}\n\n[FINAL REJECTION] Property rejected after interview.`
          : currentProperty.complianceNotes,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      property,
      message: status === 'APPROVED' 
        ? 'Property has received final approval and is now available for transactions' 
        : 'Property has been rejected at final stage'
    })
  } catch (error) {
    console.error('Error updating final approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
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
      where: { id },
      include: {
        seller: true
      }
    })

    if (!currentProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check if seller has completed KYC2 to determine visibility
    const isVisible = status === 'APPROVED' && currentProperty.seller.kyc2Status === 'PASSED'

    // Update the final approval status
    const property = await prisma.property.update({
      where: { id },
      data: {
        finalApprovalStatus: status,
        // Set visibility based on approval and seller's KYC2 status
        isVisible: isVisible,
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
        ? isVisible
          ? 'Property has received final approval and is now visible to buyers'
          : 'Property approved but not yet visible. Seller must complete KYC Level 2 verification'
        : 'Property has been rejected at final stage',
      requiresKyc2: status === 'APPROVED' && !isVisible
    })
  } catch (error) {
    console.error('Error updating final approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
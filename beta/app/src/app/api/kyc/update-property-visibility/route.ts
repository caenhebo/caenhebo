import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user with KYC2 status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        kyc2Status: true
      }
    })

    if (!user || user.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'Only sellers can update property visibility' },
        { status: 403 }
      )
    }

    // Check if KYC2 is passed
    if (user.kyc2Status !== 'PASSED') {
      return NextResponse.json(
        { error: 'KYC Level 2 verification must be completed first' },
        { status: 400 }
      )
    }

    // Update all approved properties to visible
    const updatedProperties = await prisma.property.updateMany({
      where: {
        sellerId: user.id,
        finalApprovalStatus: 'APPROVED',
        isVisible: false
      },
      data: {
        isVisible: true
      }
    })

    // Get the updated properties for response
    const visibleProperties = await prisma.property.findMany({
      where: {
        sellerId: user.id,
        finalApprovalStatus: 'APPROVED',
        isVisible: true
      },
      select: {
        id: true,
        code: true,
        title: true,
        isVisible: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `${updatedProperties.count} properties are now visible to buyers`,
      updatedCount: updatedProperties.count,
      visibleProperties: visibleProperties
    })

  } catch (error) {
    console.error('Error updating property visibility:', error)
    return NextResponse.json(
      { error: 'Failed to update property visibility' },
      { status: 500 }
    )
  }
}
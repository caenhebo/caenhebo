import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { notifyPropertyApproved, notifyPropertyRejected } from '@/lib/notifications'

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { propertyId, complianceStatus, complianceNotes, valuationPrice } = body

    // Validate required fields
    if (!propertyId || !complianceStatus) {
      return NextResponse.json(
        { error: 'Property ID and compliance status are required' },
        { status: 400 }
      )
    }

    // Validate compliance status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED']
    if (!validStatuses.includes(complianceStatus)) {
      return NextResponse.json(
        { error: 'Invalid compliance status' },
        { status: 400 }
      )
    }

    // Verify property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId }
    })

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Update property compliance status
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        complianceStatus,
        complianceNotes: complianceNotes || null,
        valuationPrice: valuationPrice ? parseFloat(valuationPrice) : null
      }
    })

    // Send notification to property owner about status change
    if (complianceStatus !== existingProperty.complianceStatus) {
      try {
        if (complianceStatus === 'APPROVED') {
          await notifyPropertyApproved(
            existingProperty.sellerId,
            existingProperty.title,
            existingProperty.id,
            existingProperty.code,
            valuationPrice ? parseFloat(valuationPrice) : undefined
          )
        } else if (complianceStatus === 'REJECTED') {
          await notifyPropertyRejected(
            existingProperty.sellerId,
            existingProperty.title,
            existingProperty.id,
            complianceNotes
          )
        }
      } catch (notificationError) {
        console.error('Failed to send property compliance notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      property: {
        id: updatedProperty.id,
        code: updatedProperty.code,
        title: updatedProperty.title,
        complianceStatus: updatedProperty.complianceStatus,
        complianceNotes: updatedProperty.complianceNotes,
        valuationPrice: updatedProperty.valuationPrice?.toString(),
        updatedAt: updatedProperty.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Property compliance update error:', error)
    return NextResponse.json(
      { error: 'Failed to update property compliance status' },
      { status: 500 }
    )
  }
}
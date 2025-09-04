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

    // Verify user is a buyer and KYC is approved
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'BUYER') {
      return NextResponse.json(
        { error: 'Only buyers can express interest in properties' },
        { status: 403 }
      )
    }

    if (user.kycStatus !== 'PASSED') {
      return NextResponse.json(
        { error: 'KYC verification required to express interest' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { propertyId, message } = body

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Verify property exists and is approved
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (property.complianceStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Can only express interest in approved properties' },
        { status: 400 }
      )
    }

    // Check if buyer is the seller (prevent self-interest)
    if (property.sellerId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot express interest in your own property' },
        { status: 400 }
      )
    }

    // Check if user has already expressed interest
    const existingInterest = await prisma.propertyInterest.findUnique({
      where: {
        propertyId_buyerId: {
          propertyId: propertyId,
          buyerId: session.user.id
        }
      }
    })

    if (existingInterest) {
      return NextResponse.json(
        { error: 'You have already expressed interest in this property' },
        { status: 409 }
      )
    }

    // Create property interest
    const interest = await prisma.propertyInterest.create({
      data: {
        propertyId: propertyId,
        buyerId: session.user.id,
        message: message || null
      },
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        property: {
          select: {
            title: true,
            code: true
          }
        }
      }
    })

    // Create notification for the seller
    const buyerName = interest.buyer.firstName && interest.buyer.lastName 
      ? `${interest.buyer.firstName} ${interest.buyer.lastName}`
      : interest.buyer.email

    await prisma.notification.create({
      data: {
        userId: property.sellerId,
        type: 'PROPERTY_INTEREST',
        title: 'New Interest in Your Property',
        message: `${buyerName} has expressed interest in your property "${interest.property.title}" (${interest.property.code})`,
        relatedEntityType: 'PROPERTY',
        relatedEntityId: propertyId,
        metadata: {
          propertyId: propertyId,
          propertyTitle: interest.property.title,
          propertyCode: interest.property.code,
          buyerId: interest.buyerId,
          buyerName: buyerName,
          buyerEmail: interest.buyer.email,
          message: message || null
        }
      }
    })

    return NextResponse.json({
      success: true,
      interest: {
        id: interest.id,
        propertyId: interest.propertyId,
        buyerId: interest.buyerId,
        message: interest.message,
        interestedAt: interest.interestedAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Property interest error:', error)
    return NextResponse.json(
      { error: 'Failed to express interest' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const propertyId = params.id

    // First verify the property exists and belongs to the seller
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { sellerId: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Only the property owner can see the interests
    if (property.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch all interests for this property
    const interests = await prisma.propertyInterest.findMany({
      where: {
        propertyId: propertyId
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            kycStatus: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        interestedAt: 'desc'
      }
    })

    // Format the response
    const formattedInterests = interests.map(interest => ({
      id: interest.id,
      buyerId: interest.buyerId,
      buyerName: `${interest.buyer.firstName || ''} ${interest.buyer.lastName || ''}`.trim() || 'Anonymous',
      buyerEmail: interest.buyer.email,
      buyerPhone: interest.buyer.phone,
      buyerKycStatus: interest.buyer.kycStatus,
      message: interest.message,
      interestedAt: interest.interestedAt,
      buyerSince: interest.buyer.createdAt
    }))

    return NextResponse.json({
      interests: formattedInterests,
      total: formattedInterests.length
    })

  } catch (error) {
    console.error('Error fetching property interests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
      { status: 500 }
    )
  }
}
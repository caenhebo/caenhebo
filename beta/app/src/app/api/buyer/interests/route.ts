import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error('No session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Session user ID:', session.user.id)
    console.log('Session user email:', session.user.email)

    // Verify user is a buyer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'BUYER') {
      return NextResponse.json(
        { error: 'Access denied. Only buyers can view their interests.' },
        { status: 403 }
      )
    }

    // Fetch all interests with property details
    console.log('Fetching interests for buyerId:', session.user.id)
    const interests = await prisma.propertyInterest.findMany({
      where: {
        buyerId: session.user.id
      },
      include: {
        property: {
          include: {
            seller: true
          }
        }
      },
      orderBy: {
        interestedAt: 'desc'
      }
    })

    console.log('Found interests:', interests.length)

    // Format the response
    const formattedInterests = interests.map(interest => ({
      id: interest.id,
      message: interest.message,
      interestedAt: interest.interestedAt,
      property: {
        id: interest.property.id,
        code: interest.property.code,
        title: interest.property.title,
        description: interest.property.description,
        location: `${interest.property.city}, ${interest.property.country}`,
        price: Number(interest.property.price),
        area: interest.property.area,
        complianceStatus: interest.property.complianceStatus,
        mainImage: null, // No images in database yet
        seller: {
          name: `${interest.property.seller.firstName || ''} ${interest.property.seller.lastName || ''}`.trim(),
          email: interest.property.seller.email
        }
      }
    }))

    return NextResponse.json({
      interests: formattedInterests,
      total: formattedInterests.length
    })

  } catch (error) {
    console.error('Failed to fetch buyer interests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error('No session found for offers API')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Offers API - Session user ID:', session.user.id)
    console.log('Offers API - Session user email:', session.user.email)

    // Fetch all transactions where the user is the buyer
    const offers = await prisma.transaction.findMany({
      where: {
        buyerId: session.user.id,
        // Exclude cancelled transactions to show only active/completed offers
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            address: true,
            city: true,
            price: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Found offers:', offers.length)

    // Format the offers for the frontend
    const formattedOffers = offers.map(offer => ({
      id: offer.id,
      propertyId: offer.propertyId,
      property: {
        ...offer.property,
        price: offer.property.price.toString()
      },
      status: offer.status,
      offerPrice: offer.offerPrice.toString(),
      agreedPrice: offer.agreedPrice?.toString() || null,
      createdAt: offer.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      offers: formattedOffers
    })

  } catch (error) {
    console.error('Error fetching buyer offers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const propertyId = params.id

    // First verify the property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, sellerId: true, title: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if user is the seller of this property
    if (property.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to view transactions for this property' },
        { status: 403 }
      )
    }

    // Fetch transactions for this property
    const transactions = await prisma.transaction.findMany({
      where: {
        propertyId: propertyId,
        status: {
          notIn: ['CANCELLED'] // Don't show cancelled transactions unless specifically requested
        }
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterOffers: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Just the latest counter offer for summary
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format the response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      buyerId: transaction.buyerId,
      status: transaction.status,
      offerPrice: transaction.offerPrice.toString(),
      agreedPrice: transaction.agreedPrice?.toString() || null,
      offerMessage: transaction.offerMessage,
      offerTerms: transaction.offerTerms,
      
      // Dates
      proposalDate: transaction.proposalDate?.toISOString() || null,
      acceptanceDate: transaction.acceptanceDate?.toISOString() || null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      
      // Buyer info
      buyer: transaction.buyer,
      
      // Latest counter offer
      latestCounterOffer: transaction.counterOffers.length > 0 ? {
        id: transaction.counterOffers[0].id,
        price: transaction.counterOffers[0].price.toString(),
        message: transaction.counterOffers[0].message,
        fromBuyer: transaction.counterOffers[0].fromBuyer,
        createdAt: transaction.counterOffers[0].createdAt.toISOString()
      } : null,
      
      // Needs seller response?
      needsSellerResponse: ['OFFER', 'NEGOTIATION'].includes(transaction.status) && (
        transaction.counterOffers.length === 0 || // Initial offer
        transaction.counterOffers[0].fromBuyer // Latest counter offer is from buyer
      )
    }))

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        title: property.title
      },
      transactions: formattedTransactions,
      summary: {
        total: formattedTransactions.length,
        needingResponse: formattedTransactions.filter(t => t.needsSellerResponse).length,
        active: formattedTransactions.filter(t => 
          ['OFFER', 'NEGOTIATION', 'AGREEMENT', 'ESCROW', 'CLOSING'].includes(t.status)
        ).length,
        completed: formattedTransactions.filter(t => t.status === 'COMPLETED').length
      }
    })

  } catch (error) {
    console.error('Property transactions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property transactions' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
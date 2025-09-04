import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'buyer' or 'seller'
    const status = searchParams.get('status') // filter by status
    const propertyId = searchParams.get('propertyId') // filter by property
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause based on user role
    const where: any = {}

    // If propertyId is specified, filter by that property only
    if (propertyId) {
      where.propertyId = propertyId
    } else {
      // Otherwise filter by user role
      where.OR = []
      if (!role || role === 'buyer') {
        where.OR.push({ buyerId: session.user.id })
      }
      
      if (!role || role === 'seller') {
        where.OR.push({ sellerId: session.user.id })
      }
    }

    if (status) {
      where.status = status
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            address: true,
            city: true,
            price: true,
            complianceStatus: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        counterOffers: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Just get latest few counter offers for listing
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Just get latest status change
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({ where })

    // Transform the data for response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      propertyId: transaction.propertyId,
      status: transaction.status,
      offerPrice: transaction.offerPrice.toString(),
      agreedPrice: transaction.agreedPrice?.toString() || null,
      offerMessage: transaction.offerMessage,
      offerTerms: transaction.offerTerms,
      
      // Dates
      proposalDate: transaction.proposalDate?.toISOString() || null,
      acceptanceDate: transaction.acceptanceDate?.toISOString() || null,
      escrowDate: transaction.escrowDate?.toISOString() || null,
      completionDate: transaction.completionDate?.toISOString() || null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      
      // Relations
      property: transaction.property,
      buyer: transaction.buyer,
      seller: transaction.seller,
      
      // User's role in this transaction
      userRole: transaction.buyerId === session.user.id ? 'buyer' : 'seller',
      
      // Latest counter offer
      latestCounterOffer: transaction.counterOffers.length > 0 ? {
        id: transaction.counterOffers[0].id,
        price: transaction.counterOffers[0].price.toString(),
        message: transaction.counterOffers[0].message,
        fromBuyer: transaction.counterOffers[0].fromBuyer,
        createdAt: transaction.counterOffers[0].createdAt.toISOString()
      } : null,
      
      // Counter offers count
      counterOffersCount: transaction.counterOffers.length,
      
      // Latest status change
      lastStatusChange: transaction.statusHistory.length > 0 ? {
        fromStatus: transaction.statusHistory[0].fromStatus,
        toStatus: transaction.statusHistory[0].toStatus,
        changedBy: transaction.statusHistory[0].changedBy,
        notes: transaction.statusHistory[0].notes,
        createdAt: transaction.statusHistory[0].createdAt.toISOString()
      } : null
    }))

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
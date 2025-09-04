import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { property: { code: { contains: search, mode: 'insensitive' } } },
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { buyer: { email: { contains: search, mode: 'insensitive' } } },
        { seller: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Fetch property interests
    const interests = await prisma.propertyInterest.findMany({
      include: {
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            city: true,
            price: true,
          },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        interestedAt: 'desc',
      },
    })

    // Fetch transactions with all related data
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          buyer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              kycStatus: true
            }
          },
          seller: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          property: {
            select: {
              id: true,
              code: true,
              title: true,
              address: true,
              city: true,
              country: true,
              price: true
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          },
          counterOffers: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    // Format the transactions with additional computed fields
    const formattedTransactions = transactions.map(transaction => {
      // Calculate duration
      const startDate = new Date(transaction.createdAt)
      const endDate = transaction.completionDate || new Date()
      const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      // Get latest status change
      const latestStatusChange = transaction.statusHistory[0]

      // Calculate progress percentage
      const statusOrder = ['OFFER', 'COUNTER_OFFER', 'ACCEPTED', 'DOCUMENTS', 'ESCROW', 'COMPLETED']
      const currentIndex = statusOrder.indexOf(transaction.status)
      const progress = transaction.status === 'FAILED' ? 0 : ((currentIndex + 1) / statusOrder.length) * 100

      return {
        id: transaction.id,
        status: transaction.status,
        progress,
        
        // Financial details
        offerPrice: Number(transaction.offerPrice),
        agreedPrice: transaction.agreedPrice ? Number(transaction.agreedPrice) : null,
        initialPayment: transaction.initialPayment ? Number(transaction.initialPayment) : null,
        paymentMethod: transaction.paymentMethod,
        cryptoPercentage: transaction.cryptoPercentage,
        fiatPercentage: transaction.fiatPercentage,
        
        // Parties
        buyer: transaction.buyer,
        seller: transaction.seller,
        
        // Property
        property: {
          ...transaction.property,
          price: Number(transaction.property.price)
        },
        
        // Timeline
        createdAt: transaction.createdAt,
        proposalDate: transaction.proposalDate,
        acceptanceDate: transaction.acceptanceDate,
        escrowDate: transaction.escrowDate,
        completionDate: transaction.completionDate,
        deadlineDate: transaction.deadlineDate,
        durationDays,
        
        // Additional details
        offerMessage: transaction.offerMessage,
        offerTerms: transaction.offerTerms,
        mediationStatus: transaction.mediationStatus,
        hasMediator: transaction.hasMediator,
        
        // History
        statusHistory: transaction.statusHistory,
        counterOffers: transaction.counterOffers.map(co => ({
          id: co.id,
          price: Number(co.price),
          message: co.message,
          terms: co.terms,
          fromBuyer: co.fromBuyer,
          accepted: co.accepted,
          rejected: co.rejected,
          createdAt: co.createdAt
        })),
        latestStatusChange,
        
        // Counts
        statusChangeCount: transaction.statusHistory.length,
        counterOfferCount: transaction.counterOffers.length
      }
    })

    // Format interests with proper decimal handling
    const formattedInterests = interests.map(interest => ({
      ...interest,
      property: {
        ...interest.property,
        price: interest.property.price.toString(),
      },
    }))

    return NextResponse.json({
      interests: formattedInterests,
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { notifyOfferAccepted, notifyOfferRejected, notifyCounterOffer } from '@/lib/notifications'

const prisma = new PrismaClient()

export async function POST(
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

    const transactionId = params.id
    const body = await request.json()
    const { action, counterPrice, message, terms } = body

    // Validate action
    if (!['accept', 'reject', 'counter'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept, reject, or counter' },
        { status: 400 }
      )
    }

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        property: true,
        buyer: true,
        seller: true,
        counterOffers: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if user is the seller
    if (transaction.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the seller can respond to offers' },
        { status: 403 }
      )
    }

    // Check if transaction is in correct status
    if (!['OFFER', 'NEGOTIATION'].includes(transaction.status)) {
      return NextResponse.json(
        { error: 'Transaction is not in a state that allows responses' },
        { status: 400 }
      )
    }

    let updatedTransaction

    if (action === 'accept') {
      // Accept the current offer
      const currentPrice = transaction.counterOffers.length > 0 
        ? transaction.counterOffers[0].price 
        : transaction.offerPrice

      updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'AGREEMENT',
          agreedPrice: currentPrice,
          acceptanceDate: new Date()
        },
        include: {
          property: true,
          buyer: true,
          seller: true,
          counterOffers: true
        }
      })

      // Create status history
      await prisma.transactionStatusHistory.create({
        data: {
          transactionId: transactionId,
          fromStatus: transaction.status,
          toStatus: 'AGREEMENT',
          changedBy: session.user.id,
          notes: 'Seller accepted the offer'
        }
      })

      // Send notification to buyer about accepted offer
      try {
        await notifyOfferAccepted(
          transaction.buyerId,
          `${transaction.seller.firstName} ${transaction.seller.lastName}`,
          transaction.property.title,
          currentPrice.toNumber(),
          transactionId,
          transaction.propertyId
        )
      } catch (notificationError) {
        console.error('Failed to send offer accepted notification:', notificationError)
      }

    } else if (action === 'reject') {
      // Reject the offer
      updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'CANCELLED'
        },
        include: {
          property: true,
          buyer: true,
          seller: true,
          counterOffers: true
        }
      })

      // Create status history
      await prisma.transactionStatusHistory.create({
        data: {
          transactionId: transactionId,
          fromStatus: transaction.status,
          toStatus: 'CANCELLED',
          changedBy: session.user.id,
          notes: 'Seller rejected the offer'
        }
      })

      // Send notification to buyer about rejected offer
      try {
        const rejectedPrice = transaction.counterOffers.length > 0 
          ? transaction.counterOffers[0].price.toNumber()
          : transaction.offerPrice.toNumber()
        
        await notifyOfferRejected(
          transaction.buyerId,
          `${transaction.seller.firstName} ${transaction.seller.lastName}`,
          transaction.property.title,
          rejectedPrice,
          transactionId,
          transaction.propertyId,
          message
        )
      } catch (notificationError) {
        console.error('Failed to send offer rejected notification:', notificationError)
      }

    } else if (action === 'counter') {
      // Make counter offer
      if (!counterPrice || parseFloat(counterPrice) <= 0) {
        return NextResponse.json(
          { error: 'Counter price is required and must be greater than zero' },
          { status: 400 }
        )
      }

      // Create counter offer
      await prisma.counterOffer.create({
        data: {
          transactionId: transactionId,
          price: parseFloat(counterPrice),
          message: message || null,
          terms: terms || null,
          fromBuyer: false // This is from seller
        }
      })

      // Update transaction status to NEGOTIATION
      updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'NEGOTIATION'
        },
        include: {
          property: true,
          buyer: true,
          seller: true,
          counterOffers: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      // Create status history if not already in negotiation
      if (transaction.status !== 'NEGOTIATION') {
        await prisma.transactionStatusHistory.create({
          data: {
            transactionId: transactionId,
            fromStatus: transaction.status,
            toStatus: 'NEGOTIATION',
            changedBy: session.user.id,
            notes: 'Seller made counter offer'
          }
        })
      }

      // Send notification to buyer about counter offer
      try {
        await notifyCounterOffer(
          transaction.buyerId,
          `${transaction.seller.firstName} ${transaction.seller.lastName}`,
          transaction.property.title,
          parseFloat(counterPrice),
          transactionId,
          transaction.propertyId,
          false // from seller
        )
      } catch (notificationError) {
        console.error('Failed to send counter offer notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: updatedTransaction.id,
        status: updatedTransaction.status,
        offerPrice: updatedTransaction.offerPrice.toString(),
        agreedPrice: updatedTransaction.agreedPrice?.toString() || null,
        acceptanceDate: updatedTransaction.acceptanceDate?.toISOString() || null,
        property: updatedTransaction.property,
        buyer: updatedTransaction.buyer,
        seller: updatedTransaction.seller,
        counterOffers: updatedTransaction.counterOffers.map(co => ({
          id: co.id,
          price: co.price.toString(),
          message: co.message,
          terms: co.terms,
          fromBuyer: co.fromBuyer,
          accepted: co.accepted,
          rejected: co.rejected,
          createdAt: co.createdAt.toISOString()
        }))
      }
    })

  } catch (error) {
    console.error('Transaction response error:', error)
    return NextResponse.json(
      { error: 'Failed to respond to transaction' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { notifyCounterOffer, notifyOfferAccepted, notifyOfferRejected } from '@/lib/notifications'

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
    const { action, counterPrice, message, terms, advancePaymentPercentage } = body

    // Validate action
    if (!['accept', 'reject', 'counter'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept, reject, or counter' },
        { status: 400 }
      )
    }

    // Fetch transaction with related data
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

    // Check if user is the buyer
    if (transaction.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the buyer can respond to counter-offers' },
        { status: 403 }
      )
    }

    // Check if transaction is in NEGOTIATION status
    if (transaction.status !== 'NEGOTIATION') {
      return NextResponse.json(
        { error: 'Transaction is not in negotiation phase' },
        { status: 400 }
      )
    }

    // Check if there's a counter-offer from seller to respond to
    const lastCounterOffer = transaction.counterOffers[0]
    if (!lastCounterOffer || lastCounterOffer.fromBuyer) {
      return NextResponse.json(
        { error: 'No pending counter-offer from seller to respond to' },
        { status: 400 }
      )
    }

    let updatedTransaction

    if (action === 'accept') {
      // Accept the seller's counter-offer
      updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'AGREEMENT',
          agreedPrice: lastCounterOffer.price,
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
          notes: 'Buyer accepted the counter-offer'
        }
      })

      // Send notification to seller
      try {
        await notifyOfferAccepted(
          transaction.sellerId,
          `${transaction.buyer.firstName} ${transaction.buyer.lastName}`,
          transaction.property.title,
          lastCounterOffer.price.toNumber(),
          transactionId,
          transaction.propertyId
        )
      } catch (notificationError) {
        console.error('Failed to send acceptance notification:', notificationError)
      }

    } else if (action === 'reject') {
      // Reject the counter-offer
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
          notes: 'Buyer rejected the counter-offer'
        }
      })

      // Send notification to seller
      try {
        await notifyOfferRejected(
          transaction.sellerId,
          `${transaction.buyer.firstName} ${transaction.buyer.lastName}`,
          transaction.property.title,
          lastCounterOffer.price.toNumber(),
          transactionId,
          transaction.propertyId,
          message
        )
      } catch (notificationError) {
        console.error('Failed to send rejection notification:', notificationError)
      }

    } else if (action === 'counter') {
      // Make a new counter-offer
      if (!counterPrice || parseFloat(counterPrice) <= 0) {
        return NextResponse.json(
          { error: 'Counter price is required and must be greater than zero' },
          { status: 400 }
        )
      }

      // Validate advance payment percentage if provided
      let advancePayment = transaction.advancePaymentPercentage || 0
      if (advancePaymentPercentage !== undefined) {
        if (advancePaymentPercentage < 0 || advancePaymentPercentage > 20) {
          return NextResponse.json(
            { error: 'Advance payment must be between 0% and 20%' },
            { status: 400 }
          )
        }
        advancePayment = advancePaymentPercentage
      }

      // Create counter offer from buyer with advance payment
      await prisma.counterOffer.create({
        data: {
          transactionId: transactionId,
          price: parseFloat(counterPrice),
          advancePaymentPercentage: advancePayment,
          message: message || null,
          terms: terms || null,
          fromBuyer: true // This is from buyer
        }
      })

      // Update transaction with new advance payment percentage
      const updateData: any = {
        advancePaymentPercentage: advancePayment
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: updateData
        })
      }

      updatedTransaction = await prisma.transaction.findUnique({
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

      // Send notification to seller about buyer's counter-offer
      try {
        await notifyCounterOffer(
          transaction.sellerId,
          `${transaction.buyer.firstName} ${transaction.buyer.lastName}`,
          transaction.property.title,
          parseFloat(counterPrice),
          transactionId,
          transaction.propertyId,
          message
        )
      } catch (notificationError) {
        console.error('Failed to send counter-offer notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction
    })

  } catch (error) {
    console.error('Error responding to counter-offer:', error)
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    )
  } finally {
  }
}